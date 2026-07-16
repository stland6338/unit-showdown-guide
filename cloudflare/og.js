/**
 * 動的OGP画像 (1200x630 PNG)。GET /og
 *
 * KVのライブ検知結果から「いま配信中 / 次の配信」を描画する。
 * 共有時にX側が固有URL（?s=クエリ）ごとにクロールし、その時点の状態が
 * カード画像として固定される。テキストのみで構成し、公式画像・
 * チャンネルアイコンは使わない（README 絶対条件2・5）。
 */
import { ImageResponse } from "workers-og";

/**
 * Google Fonts から使用文字だけのサブセットTTFを取得する。
 * workers-og の loadGoogleFont は text をURLエンコードせず日本語で壊れるため自前実装。
 * 古いUA文字列を送ると woff2 でなく satori が読める TTF が返る。
 */
async function loadFontSubset(family, weight, text) {
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;
  const cssResponse = await fetch(cssUrl, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 6.1)" },
  });
  if (!cssResponse.ok) throw new Error(`font css fetch failed: ${cssResponse.status} ${family}`);
  const css = await cssResponse.text();
  const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error(`font url not found in css: ${family}`);
  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) throw new Error(`font fetch failed: ${fontResponse.status} ${family}`);
  return fontResponse.arrayBuffer();
}

// data/schedule.seed.json と同期して管理する（KVが空の時のNEXT UPフォールバック）。
const SCHEDULE = [
  { liverName: "白砂あやね", start: "2026-07-18T19:00:00+09:00" },
  { liverName: "珠乃井ナナ", start: "2026-07-18T21:00:00+09:00" },
  { liverName: "小清水透", start: "2026-07-18T23:00:00+09:00" },
  { liverName: "水面まどか", start: "2026-07-19T19:00:00+09:00" },
  { liverName: "栞葉るり", start: "2026-07-19T21:00:00+09:00" },
  { liverName: "獅子堂あかり", start: "2026-07-19T23:00:00+09:00" },
  { liverName: "石神のぞみ", start: "2026-07-20T22:30:00+09:00" },
  { liverName: "梢桃音", start: "2026-07-21T22:00:00+09:00" },
  { liverName: "五十嵐梨花", start: "2026-07-22T22:30:00+09:00" },
  { liverName: "ソフィア・ヴァレンタイン", start: "2026-07-23T23:00:00+09:00" },
  { liverName: "鏑木ろこ", start: "2026-07-24T22:00:00+09:00" },
  { liverName: "綺沙良", start: "2026-07-25T22:00:00+09:00" },
  { liverName: "倉持めると", start: "2026-07-26T22:30:00+09:00" },
  { liverName: "司賀りこ", start: "2026-07-27T22:30:00+09:00" },
  { liverName: "にじさんじ UNIT SHOWDOWN 本戦", start: "2026-07-28T21:00:00+09:00" },
];
const MAIN_MATCH_AT = Date.parse("2026-07-28T21:00:00+09:00");

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** UTC実行環境からJST表記 (M/D(曜) HH:mm) を作る */
function formatJst(iso) {
  const date = new Date(Date.parse(iso) + 9 * 60 * 60 * 1_000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}(${WEEKDAYS_JA[date.getUTCDay()]}) ${hh}:${mm}`;
}

/** 表示状態を決める: live > upcoming(KV) > upcoming(静的) > 本戦告知 */
function resolveState(payload, now) {
  const live = (payload?.streams ?? []).filter((s) => s.liveStatus === "live");
  if (live.length > 0) {
    return { tag: "ON AIR", tone: "live", names: live.map((s) => s.liverName), when: "いま配信中！" };
  }
  const upcoming = (payload?.streams ?? [])
    .filter((s) => s.liveStatus === "upcoming" && s.scheduledStartTime)
    .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime))[0];
  if (upcoming) {
    return { tag: "NEXT UP", tone: "next", names: [upcoming.liverName], when: `${formatJst(upcoming.scheduledStartTime)} START` };
  }
  const scheduled = SCHEDULE.find((s) => Date.parse(s.start) > now);
  if (scheduled) {
    return { tag: "NEXT UP", tone: "next", names: [scheduled.liverName], when: `${formatJst(scheduled.start)} START` };
  }
  return { tag: "MAIN MATCH", tone: "next", names: ["チーム対抗大会"], when: "7/28(火) 21:00 開催" };
}

function stripes(count) {
  const cells = [];
  for (let i = 0; i < count; i++) {
    cells.push(`<div style="display:flex;width:36px;height:16px;background:${i % 2 ? "#101114" : "#F2E900"};transform:skewX(-30deg)"></div>`);
  }
  return `<div style="display:flex;flex-direction:row;overflow:hidden">${cells.join("")}</div>`;
}

export async function handleOg(request, env, ctx) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const payload = await env.LIVE_KV.get("live", "json");
  const now = Date.now();
  const state = resolveState(payload, now);
  const daysLeft = Math.max(0, Math.ceil((MAIN_MATCH_AT - now) / 86_400_000));
  const isLive = state.tone === "live";
  const accent = isLive ? "#FF4655" : "#F2E900";
  const nameList = state.names.slice(0, 3).map(escapeHtml).join("・") + (state.names.length > 3 ? " ほか" : "");
  const footer = MAIN_MATCH_AT > now ? `MAIN MATCH まで あと${daysLeft}日` : "MAIN MATCH 開催中・アーカイブ公開中";

  const html = `
  <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#101114;color:#ECEDE8;font-family:'Zen Kaku Gothic New'">
    <div style="display:flex;justify-content:center;align-items:center;height:44px;background:#F2E900;color:#101114;font-size:19px;font-weight:700;letter-spacing:2px">
      UNOFFICIAL FAN GUIDE — 非公式ファンサイト
    </div>
    <div style="display:flex;flex-direction:column;flex:1;padding:44px 64px 0">
      <div style="display:flex;color:#F2E900;font-family:'Chakra Petch';font-size:24px;letter-spacing:4px">
        NIJISANJI × ARKNIGHTS: ENDFIELD — #PR
      </div>
      <div style="display:flex;font-family:'Chakra Petch';font-size:84px;font-weight:700;color:#F2E900;margin-top:4px">
        UNIT SHOWDOWN
      </div>
      <div style="display:flex;flex-direction:column;border:3px solid ${accent};background:#17181d;padding:24px 32px;margin-top:20px">
        <div style="display:flex;flex-direction:row;align-items:center">
          <div style="display:flex;background:${accent};color:${isLive ? "#ffffff" : "#101114"};font-family:'Chakra Petch';font-size:26px;font-weight:700;padding:4px 18px;letter-spacing:3px">
            ${isLive ? "● " : ""}${state.tag}
          </div>
          <div style="display:flex;color:${accent};font-size:28px;font-weight:700;margin-left:24px">
            ${escapeHtml(state.when)}
          </div>
        </div>
        <div style="display:flex;font-size:56px;font-weight:700;margin-top:14px">
          ${nameList}
        </div>
      </div>
      <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;margin-top:22px;color:#8a8d94;font-size:24px">
        <div style="display:flex">${escapeHtml(footer)}</div>
        <div style="display:flex;font-family:'Chakra Petch'">unit-showdown-guide.pages.dev</div>
      </div>
    </div>
    ${stripes(40)}
  </div>`;

  const visibleText = html.replace(/<[^>]+>/g, "") + "0123456789";
  const jaText = [...new Set(visibleText.split(""))].filter((ch) => ch.trim()).join("");
  const latinText = [...new Set(`${visibleText}ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`.split(""))]
    .filter((ch) => ch.charCodeAt(0) < 0x2000)
    .join("");
  const [jaFont, displayFont] = await Promise.all([
    loadFontSubset("Zen Kaku Gothic New", 700, jaText),
    loadFontSubset("Chakra Petch", 700, latinText),
  ]);

  const image = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Zen Kaku Gothic New", data: jaFont, weight: 700, style: "normal" },
      { name: "Chakra Petch", data: displayFont, weight: 700, style: "normal" },
    ],
  });

  const response = new Response(image.body, {
    status: 200,
    headers: {
      "content-type": "image/png",
      // X/Discordのクローラに5分で再検証させる（LIVE反映の鮮度とKV負荷のバランス）
      "cache-control": "public, max-age=300",
    },
  });
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}
