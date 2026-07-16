# SPEC — 機能仕様

技術スタック: Next.js 14 (App Router) + TypeScript + Tailwind CSS 3.4、`output: "export"`（`../アルプススタンド2026/next.config.mjs` と同一設定: `trailingSlash: true`, `images.unoptimized: true`）。

## 1. ページ仕様

### `/`（トップ）
デザインカンプ: `design/mockup.html`（これが正）。セクション順:
1. **Hero**: 企画名・「非公式ファンサイト」表記・本戦カウントダウン（クライアントで1秒更新、JST固定表示）
2. **NOW LIVE / NEXT UP**: Worker `/api/live` をポーリングする LiveSlots（後述）。LIVE中はチャンネルへの埋め込みリンクカード、なければ次の練習配信を表示
3. **練習配信スケジュール**: 14件を日付グループで縦タイムライン表示（`/schedule` の要約版、直近3日分）
4. **本戦情報**: 7/28(火)21:00、チーム対抗、優勝賞品あり。チーム編成は「発表待ち」プレースホルダ
5. **エンドフィールドとは**: 3行要約 + `/endfield` への導線
6. **Footer**: 免責（非公式・各権利表記・情報源リンク）

### `/schedule`
- 全14件 + 本戦を `StreamCard` グリッドで表示。ステータス: `live / upcoming / archived`
- 各カードにライバー名・日時（JST・曜日）・YouTubeチャンネルリンク。配信枠URLが判明したら `videoId` を data に追記して直リンク化
- ライブ検知結果（Worker）と静的データを videoId / channelId でマージ（アルプススタンドの `TodayAlpsStand.tsx` パターン）

### `/endfield`
- 静的な読み物ページ。データソースは `data/endfield-facts.json`（全項目に情報源ラベル）
- 構成: ゲーム概要 / 開発・運営 / リリースと対応機種 / アークナイツとの関係 / 用語ミニ辞典 / 現行バージョン「向淵行」/ 公式リンク集
- 注意書き: 「本ページはファンによる紹介であり公式情報は公式サイトを参照」

## 2. データスキーマ

`src/lib/types.ts`。アルプススタンド2026 の `Stream` 型を簡約して流用:

```typescript
export type LiveStatus = "upcoming" | "live" | "archived";
export type SourceLabel = "official" | "wiki" | "stream" | "ai_extracted" | "editor";

export interface ShowdownStream {
  id: string;                    // "practice-shirasuna" 等の安定ID
  liverName: string;
  channelId: string | null;      // 未収集時 null → カードはチャンネル検索リンクにフォールバック
  channelUrl: string | null;
  videoId: string | null;        // 枠確定後に追記
  kind: "practice" | "main";
  scheduledStartTime: string;    // ISO8601 (+09:00)
  liveStatus: LiveStatus;        // ビルド時は時刻から導出、実行時はWorkerが上書き
  source: SourceLabel;
  verified: boolean;
}
```

- シードデータ: `data/schedule.seed.json`（本リポジトリに作成済み。**日時・氏名は公式画像から目視確認済み** `verified: true, source: "official"`。channelId のみ未収集で null）
- 表示ゲート: `verified === false` のデータは要確認バッジ必須（`getStreams()` で一元管理、バイパス禁止）

## 3. 配信検知 Worker（`cloudflare/live-worker.js`）

アルプススタンド2026 の `cloudflare/live-worker.js` をコピーして以下を改変（フルスクラッチ禁止・実績コード流用）:

| 項目 | 変更内容 |
|---|---|
| 監視ch | 監督10ch+朝晴9ch → **参加14ch + にじさんじ公式ch**（`data/schedule.seed.json` から生成した定数） |
| 関連判定 `KEYWORDS` | `["エンドフィールド","endfield","ユニショーダウン","unit showdown","アークナイツ"]` |
| 熱狂・切り抜き・admin API | **削除**（今回スコープ外） |
| Cron | `*/5 * * * *` のみ（18:30 の切り抜きCronは削除） |
| KVキー | `live` のみ |

### API
```
GET /api/live
→ 200 { generatedAt: string, streams: LiveItem[], recentArchives: ArchiveItem[] }
   CORS: Access-Control-Allow-Origin: *（読み取り専用・秘匿情報なし）
```
- 判定は `videos.list` の `snippet.liveBroadcastContent`（`live`/`upcoming`/`none`）
- `actualEndTime` が48h以内 → `recentArchives`（終了直後の即時反映、追加クォータゼロ）

## 4. フロントの検知連携

`src/components/LiveSlots.tsx`（アルプススタンドから流用）:
- `"use client"`。マウント時 + `setInterval` 5分 + `visibilitychange` で `fetch(config.liveApiUrl, { cache: "no-store" })`
- 失敗時は前回値/静的フォールバックを維持（サイトは絶対に壊れない）
- `config.liveApiUrl` は `src/lib/config.ts` に定数化（Worker デプロイ後のURLを設定）

## 5. 検証（受け入れ条件）

1. `npm run build` が警告なしで通り、`out/` に3ページ + sitemap が出る
2. `node scripts/check-data.mjs`（スキーマ検証、アルプススタンドの `check-data.mjs` を簡約流用）が通る
3. Worker をローカル起動（`npx wrangler dev -c wrangler-live.toml`）し、`/api/live` が上記スキーマのJSONを返す
4. 実在のLIVE配信中チャンネルを監視リストに一時追加し、`live` 判定が付くことを確認
5. モバイル幅 375px で横スクロールが発生しない
6. 全ページに「非公式」表記が表示される
