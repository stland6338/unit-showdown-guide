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

// 7/28開催分は地震の影響で延期（公式ポスト 2082054214457684201）→ 8/18(火) 21:00 に振替（公式ポスト 2088083337810456868）。
const MAIN_MATCH_AT = Date.parse("2026-08-18T21:00:00+09:00");
const MAIN_MATCH_LABEL = "8/18(火) 21:00";
// 振替日程が未発表の間だけ true にする（現在は振替確定済み）。
const MAIN_MATCH_POSTPONED = false;
// 本戦当日ライブ判定: 本戦（神視点）の videoId / channelId。ON AIR 表示で本戦を優先する。
const MAIN_MATCH_VIDEO_ID = "A7lY0WOsH8M";
const MAIN_MATCH_CHANNEL_ID = "UCTIE7LM5X15NVugV7Krp9Hw";

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** 表示状態を決める: live中はON AIR、それ以外は企画全体の汎用カード */
function resolveState(payload, now) {
  const live = (payload?.streams ?? []).filter((s) => s.liveStatus === "live");
  const mainLive = live.some((s) => s.videoId === MAIN_MATCH_VIDEO_ID || s.channelId === MAIN_MATCH_CHANNEL_ID);
  if (mainLive) {
    // 本戦モード: 各ライバー視点が同時に並んでも本戦を最優先で出す
    const povNames = live.filter((s) => s.channelId !== MAIN_MATCH_CHANNEL_ID).map((s) => s.liverName);
    return {
      tag: "ON AIR",
      tone: "live",
      names: ["UNIT SHOWDOWN 本戦", ...povNames],
      when: povNames.length > 0 ? `本戦配信中！ 各視点 ${povNames.length}名も配信中` : "本戦配信中！",
    };
  }
  if (live.length > 0) {
    return { tag: "ON AIR", tone: "live", names: live.map((s) => s.liverName), when: "いま配信中！" };
  }
  if (MAIN_MATCH_POSTPONED) {
    return {
      tag: "EVENT GUIDE",
      tone: "next",
      names: ["ライバー14名によるチーム対抗大会"],
      when: "本戦は延期（日程後日発表）/ 練習アーカイブ公開中",
    };
  }
  if (MAIN_MATCH_AT > now) {
    return {
      tag: "EVENT GUIDE",
      tone: "next",
      names: ["ライバー14名によるチーム対抗大会"],
      when: `本戦 ${MAIN_MATCH_LABEL}（振替）/ 練習アーカイブ公開中`,
    };
  }
  return { tag: "EVENT GUIDE", tone: "next", names: ["チーム対抗大会"], when: "本戦終了・アーカイブ公開中" };
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
  const footer = MAIN_MATCH_POSTPONED
    ? "MAIN MATCH は延期 — 続報を待とう"
    : MAIN_MATCH_AT > now
      ? `MAIN MATCH まで あと${daysLeft}日`
      : "MAIN MATCH 開催中・アーカイブ公開中";

  const html = `
  <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#101114;color:#ECEDE8;font-family:'Zen Kaku Gothic New'">
    <div style="display:flex;justify-content:center;align-items:center;height:44px;background:#F2E900;color:#101114;font-size:19px;font-weight:700;letter-spacing:2px">
      UNOFFICIAL FAN GUIDE — 非公式ファンサイト
    </div>
    <div style="display:flex;flex-direction:column;flex:1;padding:44px 64px 0">
      <div style="display:flex;color:#F2E900;font-family:'Chakra Petch';font-size:24px;letter-spacing:4px">
        NIJISANJI × ARKNIGHTS: ENDFIELD — #PR
      </div>
      <div style="display:flex;font-family:'Chakra Petch';font-size:64px;font-weight:700;color:#F2E900;margin-top:8px">
        NIJISANJI UNIT SHOWDOWN
      </div>
      <div style="display:flex;margin-top:10px">
        <div style="display:flex;border:2px solid #F2E900;color:#F2E900;font-size:24px;font-weight:700;padding:4px 18px;letter-spacing:3px;transform:rotate(-1deg)">
          非公式観戦ガイド — UNOFFICIAL FAN GUIDE
        </div>
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
