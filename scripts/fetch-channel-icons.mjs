// 各ライバーのYouTubeチャンネルページから og:image（チャンネルアイコンURL）を取得し、
// data/schedule.seed.json の channelIcon を更新する。アイコンURLが変わった時に再実行する。
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "schedule.seed.json");
const RETRIES = 3;

async function fetchIcon(channelUrl) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(channelUrl, {
        signal: controller.signal,
        headers: { "accept-language": "ja" },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const match = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (!match) throw new Error("og:image が見つからない");
      return match[1];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === RETRIES) throw new Error(`${channelUrl}: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));
let updated = 0;
for (const stream of data.streams) {
  if (!stream.channelUrl) continue;
  const icon = await fetchIcon(stream.channelUrl);
  if (stream.channelIcon !== icon) {
    stream.channelIcon = icon;
    updated++;
  }
  console.log(`✓ ${stream.liverName}: ${icon.slice(0, 60)}…`);
}

fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`done: ${updated}件更新`);
