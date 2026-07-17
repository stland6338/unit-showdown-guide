/**
 * showdown-sentinel — AI外形監視（docs/MONITORING-PLAN.md）
 *
 * Cron毎: Browser Renderingで実ページを開いて証拠収集 → Workers AIが
 * healthy/degraded/down を判定 → Resendでメール報告（MAIL_MODE=change:
 * 状態変化時+日次サマリ / every: 毎チェック）。
 * AI失敗時は決定的フォールバック判定に切り替え、判定不能では止まらない。
 */
import puppeteer from "@cloudflare/puppeteer";

const SITE_URL = "https://unit-showdown-guide.pages.dev/";
const LIVE_API_URL = "https://showdown-live.stland6338.workers.dev/api/live";
const OG_URL = "https://showdown-live.stland6338.workers.dev/og";
const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const FRESHNESS_LIMIT_MS = 20 * 60 * 1_000;
const HISTORY_LIMIT = 120;
const DIGEST_HOUR_JST = 8;

// ---------- 証拠収集 ----------

async function collectBrowserEvidence(env) {
  const evidence = { step: "browser" };
  let browser = null;
  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
    });
    const startedAt = Date.now();
    const response = await page.goto(SITE_URL, { waitUntil: "networkidle0", timeout: 30_000 });
    evidence.httpStatus = response?.status() ?? null;
    evidence.loadTimeMs = Date.now() - startedAt;
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    evidence.hasUnofficialBanner = bodyText.includes("非公式のファンサイト");
    evidence.hasLiveSection = /NOW LIVE|NEXT UP/.test(bodyText);
    evidence.hasCountdown = /DAYS|開催中/.test(bodyText);
    evidence.bodyTextLength = bodyText.length;
    evidence.consoleErrors = consoleErrors.slice(0, 5);
  } catch (error) {
    evidence.error = error instanceof Error ? error.message : String(error);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  return evidence;
}

async function collectFetchEvidence(env) {
  // workers.dev への Worker間直fetch は 1042 で遮断されるため service binding を使う
  const upstream = env.LIVE_WORKER ?? { fetch: (input, init) => fetch(input, init) };
  const live = { step: "liveApi", viaBinding: Boolean(env.LIVE_WORKER) };
  try {
    const startedAt = Date.now();
    const response = await upstream.fetch(LIVE_API_URL, { signal: AbortSignal.timeout(10_000) });
    live.httpStatus = response.status;
    live.latencyMs = Date.now() - startedAt;
    const payload = await response.json();
    live.generatedAt = payload.generatedAt ?? null;
    live.ageMs = payload.generatedAt ? Date.now() - Date.parse(payload.generatedAt) : null;
    live.fresh = live.ageMs !== null && live.ageMs < FRESHNESS_LIMIT_MS;
    live.liveCount = (payload.streams ?? []).filter((s) => s.liveStatus === "live").length;
  } catch (error) {
    live.error = error instanceof Error ? error.message : String(error);
  }

  const og = { step: "ogImage" };
  try {
    const response = await upstream.fetch(OG_URL, { signal: AbortSignal.timeout(15_000) });
    og.httpStatus = response.status;
    og.contentType = response.headers.get("content-type");
    og.bytes = (await response.arrayBuffer()).byteLength;
    og.ok = response.status === 200 && og.contentType === "image/png" && og.bytes > 10_000;
  } catch (error) {
    og.error = error instanceof Error ? error.message : String(error);
  }
  return { live, og };
}

// ---------- 判定 ----------

/** AI不調時の決定的フォールバック（最終防衛線） */
function deterministicVerdict(evidence) {
  const reasons = [];
  const pageDead =
    evidence.browser.error || !evidence.browser.httpStatus || evidence.browser.httpStatus >= 500 ||
    (evidence.browser.bodyTextLength ?? 0) < 100;
  if (pageDead) {
    reasons.push(evidence.browser.error ?? `top page http=${evidence.browser.httpStatus}`);
    return { status: "down", reasons, summary: "トップページが開けません（機械判定）。", judge: "fallback" };
  }
  if (!evidence.browser.hasUnofficialBanner) reasons.push("非公式帯が見つからない");
  if (evidence.live.error || !evidence.live.fresh) reasons.push("live APIが停止または鮮度切れ");
  if (evidence.og.error || !evidence.og.ok) reasons.push("OG画像が異常");
  if (evidence.browser.consoleErrors?.length) reasons.push("consoleエラーあり");
  if ((evidence.browser.loadTimeMs ?? 0) > 8_000) reasons.push("応答が8秒超");
  if (reasons.length > 0) {
    return { status: "degraded", reasons, summary: "一部の検査に失敗しています（機械判定）。", judge: "fallback" };
  }
  return { status: "healthy", reasons: [], summary: "全検査に合格（機械判定）。", judge: "fallback" };
}

async function aiVerdict(env, evidence) {
  // 生の数値の解釈ミスを防ぐため、判定済みブール値も併記して渡す
  const derived = {
    pageLoaded: !evidence.browser.error && (evidence.browser.httpStatus ?? 599) < 500 && (evidence.browser.bodyTextLength ?? 0) >= 100,
    unofficialBannerPresent: evidence.browser.hasUnofficialBanner === true,
    liveApiFresh: evidence.live.fresh === true,
    ogImageOk: evidence.og.ok === true,
    consoleErrorCount: evidence.browser.consoleErrors?.length ?? 0,
    loadTimeUnder8s: (evidence.browser.loadTimeMs ?? 99_999) <= 8_000,
  };
  const prompt = `あなたはWebサイトの外形監視の判定担当です。以下の証拠から、利用者にとってサイトが機能しているかを判定してください。

判定基準（derivedのブール値を正として使うこと）:
- down: pageLoaded=false
- degraded: pageLoaded=true だが liveApiFresh=false / ogImageOk=false / consoleErrorCount>0 / unofficialBannerPresent=false / loadTimeUnder8s=false のいずれか
- healthy: 上記なし

derived（判定済みフラグ）:
${JSON.stringify(derived)}

生の証拠（reasonsとsummaryの記述に使う）:
${JSON.stringify(evidence)}

次のJSONだけを出力してください（説明文の前後付加禁止）:
{"status":"healthy|degraded|down","reasons":["…"],"summary":"日本語1〜2文の診断"}`;

  const result = await env.AI.run(AI_MODEL, {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 512,
  });
  // モデルにより response が string / object の両方があり得る
  const raw = typeof result === "string" ? result : result?.response ?? result;
  let parsed;
  if (raw && typeof raw === "object") {
    parsed = raw;
  } else {
    const match = String(raw ?? "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`AI応答にJSONがない: ${String(raw).slice(0, 80)}`);
    parsed = JSON.parse(match[0]);
  }
  if (!["healthy", "degraded", "down"].includes(parsed.status)) throw new Error(`status不正: ${parsed.status}`);
  return {
    status: parsed.status,
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 8) : [],
    summary: String(parsed.summary ?? "").slice(0, 300),
    judge: "ai",
  };
}

// ---------- メール ----------

async function sendMail(env, subject, text) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "RESEND_API_KEY未設定" };
  if (!env.MAIL_TO) return { sent: false, reason: "MAIL_TO未設定" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "sentinel <onboarding@resend.dev>",
      to: [env.MAIL_TO],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { sent: false, reason: `resend ${response.status}: ${detail.slice(0, 200)}` };
  }
  return { sent: true };
}

function formatJstTime(epochMs) {
  const date = new Date(epochMs + 9 * 60 * 60 * 1_000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${hh}:${mm}`;
}

function buildMailBody(verdict, evidence, prevStatus) {
  return [
    `診断: ${verdict.summary}`,
    verdict.reasons.length ? `理由: ${verdict.reasons.join(" / ")}` : "理由: 問題なし",
    `判定方式: ${verdict.judge === "ai" ? "Workers AI" : "AI判定失敗・機械判定"} / 前回: ${prevStatus ?? "初回"}`,
    "",
    "--- 証拠 ---",
    `トップ: http=${evidence.browser.httpStatus} load=${evidence.browser.loadTimeMs}ms 非公式帯=${evidence.browser.hasUnofficialBanner} LIVE枠=${evidence.browser.hasLiveSection} consoleエラー=${evidence.browser.consoleErrors?.length ?? "?"}${evidence.browser.error ? ` 収集エラー=${evidence.browser.error}` : ""}`,
    `live API: http=${evidence.live.httpStatus} 鮮度=${evidence.live.ageMs != null ? `${Math.round(evidence.live.ageMs / 60000)}分前` : "不明"} LIVE中=${evidence.live.liveCount ?? "?"}件${evidence.live.error ? ` エラー=${evidence.live.error}` : ""}`,
    `OG画像: http=${evidence.og.httpStatus} ${evidence.og.bytes ?? 0}bytes${evidence.og.error ? ` エラー=${evidence.og.error}` : ""}`,
    "",
    SITE_URL,
  ].join("\n");
}

// ---------- 本体 ----------

async function runCheck(env, { forceMail = false } = {}) {
  const [browserEvidence, fetched] = await Promise.all([collectBrowserEvidence(env), collectFetchEvidence(env)]);
  const evidence = { browser: browserEvidence, live: fetched.live, og: fetched.og, checkedAt: new Date().toISOString() };

  let verdict;
  try {
    verdict = await aiVerdict(env, evidence);
  } catch (error) {
    console.error("ai verdict failed", error instanceof Error ? error.message : String(error));
    verdict = deterministicVerdict(evidence);
  }

  const state = (await env.SENTINEL_KV.get("state", "json")) ?? { history: [] };
  const prevStatus = state.lastStatus ?? null;
  const changed = prevStatus !== null && prevStatus !== verdict.status;
  const now = Date.now();

  // 日次サマリ: JST 8時台の最初のチェックで直近24hを集計
  const jstHour = new Date(now + 9 * 3_600_000).getUTCHours();
  const lastDigestAt = state.lastDigestAt ?? 0;
  const digestDue = jstHour === DIGEST_HOUR_JST && now - lastDigestAt > 20 * 3_600_000;

  const mode = env.MAIL_MODE ?? "change";
  const shouldMail = forceMail || mode === "every" || prevStatus === null || changed || digestDue;

  let mail = { sent: false, reason: "skip (no change)" };
  if (shouldMail) {
    let subject = `[SENTINEL][${verdict.status.toUpperCase()}] unit-showdown-guide ${formatJstTime(now)}`;
    let body = buildMailBody(verdict, evidence, prevStatus);
    if (digestDue && !changed) {
      const day = state.history.filter((h) => now - h.at < 24 * 3_600_000);
      const counts = { healthy: 0, degraded: 0, down: 0 };
      for (const h of day) counts[h.status] = (counts[h.status] ?? 0) + 1;
      subject = `[SENTINEL][DIGEST] 直近24h: healthy=${counts.healthy} degraded=${counts.degraded} down=${counts.down}`;
      body = `直近24時間 ${day.length}チェックの内訳: ${JSON.stringify(counts)}\n\n現在の状態:\n${body}`;
    }
    mail = await sendMail(env, subject, body);
    if (!mail.sent) console.error("mail failed", mail.reason);
  }

  state.lastStatus = verdict.status;
  if (digestDue) state.lastDigestAt = now;
  state.history = [{ at: now, status: verdict.status, summary: verdict.summary }, ...state.history].slice(0, HISTORY_LIMIT);
  await env.SENTINEL_KV.put("state", JSON.stringify(state));

  return { verdict, evidence, mail, changed, digestDue };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      runCheck(env).catch((error) => {
        console.error("sentinel check failed", error instanceof Error ? error.message : String(error));
      })
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/run") {
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!env.RUN_TOKEN || token !== env.RUN_TOKEN) return new Response("unauthorized", { status: 401 });
      try {
        const result = await runCheck(env, { forceMail: url.searchParams.get("mail") === "1" });
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: message }), { status: 500 });
      }
    }
    return new Response("showdown-sentinel", { status: 200 });
  },
};
