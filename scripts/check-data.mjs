// data/*.json のスキーマ・参照整合チェック。CIやビルド前に実行する。
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
const errors = [];
const warnings = [];

const SOURCE_LABELS = new Set(["official", "wiki", "stream", "ai_extracted", "editor"]);
const LIVE_STATUSES = new Set(["upcoming", "live", "archived"]);
const CHANNEL_ID = /^UC[0-9A-Za-z_-]{22}$/;
const VIDEO_ID = /^[0-9A-Za-z_-]{11}$/;
const HTTPS_URL = /^https:\/\//;

const schedule = read("schedule.seed.json");
if (!Array.isArray(schedule.streams)) errors.push("schedule.seed.json: streams が配列でない");

const streams = schedule.streams ?? [];
if (streams.length !== 15) errors.push(`schedule.seed.json: 15件であるべきが ${streams.length}件`);
if (streams.filter((s) => s.kind === "practice").length !== 14)
  errors.push("schedule.seed.json: practice は14件必要");
if (streams.filter((s) => s.kind === "main").length !== 1)
  errors.push("schedule.seed.json: main は1件必要");

const ids = new Set();
const channelIds = new Set();
for (const stream of streams) {
  const at = `schedule/${stream.id ?? "(idなし)"}`;
  if (!stream.id || ids.has(stream.id)) errors.push(`${at}: id が空または重複`);
  ids.add(stream.id);
  if (!stream.liverName) errors.push(`${at}: liverName が空`);
  if (!new Set(["practice", "main"]).has(stream.kind)) errors.push(`${at}: kind 不正 ${stream.kind}`);
  if (!LIVE_STATUSES.has(stream.liveStatus)) errors.push(`${at}: liveStatus 不正 ${stream.liveStatus}`);
  if (!SOURCE_LABELS.has(stream.source)) errors.push(`${at}: source 不正 ${stream.source}`);
  if (typeof stream.verified !== "boolean") errors.push(`${at}: verified が boolean でない`);
  if (stream.verified && stream.source === "ai_extracted")
    errors.push(`${at}: verified:true なのに source が ai_extracted`);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(stream.scheduledStartTime ?? ""))
    errors.push(`${at}: scheduledStartTime は +09:00 のISO8601にする`);
  if (Number.isNaN(Date.parse(stream.scheduledStartTime))) errors.push(`${at}: 日時を解釈できない`);
  if (stream.videoId !== null && !VIDEO_ID.test(stream.videoId))
    errors.push(`${at}: videoId 形式不正 ${stream.videoId}`);
  if (stream.channelIcon != null && !/^https:\/\/yt3\.(googleusercontent|ggpht)\.com\//.test(stream.channelIcon))
    errors.push(`${at}: channelIcon はYouTube配信のアイコンURL (yt3.*) にする`);
  for (const announcement of stream.announcements ?? []) {
    if (!/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+$/.test(announcement.url ?? ""))
      errors.push(`${at}: announcement.url がx.comのポストURLでない`);
    if (!new Set(["参加告知", "配信告知"]).has(announcement.label))
      errors.push(`${at}: announcement.label 不正 ${announcement.label}`);
  }
  if (stream.kind === "practice") {
    if (!CHANNEL_ID.test(stream.channelId ?? "")) errors.push(`${at}: channelId 形式不正 ${stream.channelId}`);
    if (channelIds.has(stream.channelId)) errors.push(`${at}: channelId 重複 ${stream.channelId}`);
    channelIds.add(stream.channelId);
    const expectedUrl = `https://www.youtube.com/channel/${stream.channelId}`;
    if (stream.channelUrl !== expectedUrl) errors.push(`${at}: channelUrl は ${expectedUrl} にする`);
  } else if (stream.channelId !== null && !CHANNEL_ID.test(stream.channelId)) {
    errors.push(`${at}: main の channelId 形式不正`);
  }
}

const eventFile = read("event.json");
const event = eventFile.event;
if (!event?.name) errors.push("event.json: event.name が空");
if (event?.practicePeriod?.liverCount !== 14) errors.push("event.json: liverCount は14");
if (event?.mainMatch?.datetime !== streams.find((s) => s.kind === "main")?.scheduledStartTime)
  errors.push("event.json: 本戦日時が schedule.seed.json と不一致");
if (!SOURCE_LABELS.has(event?.source)) errors.push("event.json: source 不正");
if (event?.verified !== true) errors.push("event.json: event は verified:true が必要");
for (const source of event?.sources ?? []) {
  if (!source.label || !HTTPS_URL.test(source.url ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt ?? ""))
    errors.push("event.json: sources の label/url/checkedAt が不正");
}

if (event?.casters) {
  if (!Array.isArray(event.casters.items) || event.casters.items.length === 0)
    errors.push("event.json: casters.items が空");
  for (const caster of event.casters.items ?? []) {
    if (!caster.name || !caster.role || !/^https:\/\/x\.com\//.test(caster.tweetUrl ?? ""))
      errors.push(`event.json: caster ${caster.name ?? "(名前なし)"} の name/role/tweetUrl が不正`);
  }
  if (event.casters.verified !== true) errors.push("event.json: casters は verified:true が必要");
}

const endfield = read("endfield-facts.json");
if (!Array.isArray(endfield.facts)) errors.push("endfield-facts.json: facts が配列でない");
const factKeys = new Set();
for (const fact of endfield.facts ?? []) {
  const at = `endfield-facts/${fact.key ?? "(keyなし)"}`;
  if (!fact.key || factKeys.has(fact.key)) errors.push(`${at}: key が空または重複`);
  factKeys.add(fact.key);
  if (!fact.label || !fact.value) errors.push(`${at}: label/value が空`);
  if (!SOURCE_LABELS.has(fact.source)) errors.push(`${at}: source 不正 ${fact.source}`);
  if (typeof fact.verified !== "boolean") errors.push(`${at}: verified が boolean でない`);
  if (fact.verified && fact.source === "ai_extracted")
    errors.push(`${at}: verified:true なのに source が ai_extracted`);
  if (fact.checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(fact.checkedAt))
    errors.push(`${at}: checkedAt 形式不正`);
  if (fact.sourceUrl && !HTTPS_URL.test(fact.sourceUrl)) errors.push(`${at}: sourceUrl は https URL にする`);
}

for (const link of endfield.officialLinks ?? []) {
  if (!link.label || !HTTPS_URL.test(link.url ?? "")) errors.push("endfield-facts.json: officialLinks が不正");
}

const pendingFacts = (endfield.facts ?? []).filter((fact) => !fact.verified).length;
if (pendingFacts > 0) warnings.push(`endfield-facts: verified:false を ${pendingFacts}件、表示ゲートで除外します`);

for (const warning of warnings) console.log(`ℹ ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`✗ ${error}`);
  process.exit(1);
}

console.log(`✓ check:data OK (streams=${streams.length}, channels=${channelIds.size}, facts=${endfield.facts.length})`);
