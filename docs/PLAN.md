# PLAN — アーキテクチャと公開計画

## Context

にじさんじの #PR 企画「エンドフィールド×にじさんじ UNIT SHOWDOWN」（本戦 2026-07-28 21:00、練習配信 7/18〜7/27・14名）の非公式観戦ガイドを作る。
アルプススタンド2026 で運用実績のある「Cloudflare Pages（静的サイト）+ Cloudflare Worker（配信検知）」二層構成をそのまま踏襲し、実装コストと運用リスクを最小化する。

- デザイン: Claude Fable が設計済み（docs/DESIGN.md + design/mockup.html）
- 実装: Codex が AGENTS.md / TODO.md に従って実施

## 全体アーキテクチャ

```
┌──────────────────────────────┐
│ Cloudflare Pages（静的サイト）              │
│  Next.js 14 App Router / output:"export"    │
│  プロジェクト名: unit-showdown-guide        │
└──────────────┬───────────────┘
               │ fetch (5分ポーリング + visibilitychange)
┌──────────────▼───────────────┐
│ Cloudflare Worker: showdown-live             │
│  wrangler-live.toml / KV: LIVE_KV            │
│  Cron: */5 * * * *                           │
│  YouTube Data API v3（secret: YOUTUBE_API_KEY）│
│  GET /api/live → { streams, recentArchives } │
└──────────────────────────────┘
```

### なぜこの構成か

- **Pages は純SSG**: イベント期間が約2週間と短く、コンテンツ更新はデータJSON編集→再ビルドで足りる。ISR/SSR 不要
- **検知はWorker分離**: APIキー秘匿・5分Cron・KVキャッシュの実績パターン（`../アルプススタンド2026/cloudflare/live-worker.js` 785行）を流用改変するのが最速
- **クォータ試算**: 監視14ch + 公式ch。playlistItems 15回 + videos.list 一括 ≒ 16 units/5分 → 約 4,600 units/日 < 10,000 の無料枠内

## 検知対象

- 参加ライバー14名の YouTube チャンネル（channelId は実装時に公式サイトから収集: TODO.md 参照）
- にじさんじ公式チャンネル（本戦 7/28 の配信枠が立つ場所の候補。枠URL確定後は手動ピン留めでも可）
- 関連判定キーワード: `エンドフィールド` `Endfield` `ユニショーダウン` `UNIT SHOWDOWN` `アークナイツ`

## Cloudflare 公開手順（デプロイ計画）

1. **リポジトリ**: GitHub に `unit-showdown-guide` を新規作成（private可）
2. **Pages**: `cloudflare/wrangler-action@v3` で `pages deploy out --project-name unit-showdown-guide`
   - GitHub Actions: main push 時 + 毎朝6:00 JST cron（アルプススタンドの `daily-deploy.yml` を流用）
   - 必要 secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（既存アカウントと共通）
3. **Worker**: `npx wrangler deploy -c wrangler-live.toml`（手動デプロイ）
   - KV namespace `LIVE_KV` を新規作成しバインド
   - `npx wrangler secret put YOUTUBE_API_KEY -c wrangler-live.toml`
4. **本番URL**: `unit-showdown-guide.pages.dev`（カスタムドメインは任意・後続判断）

## スコープ外（やらないこと）

- 切り抜き収集・管理画面・repository_dispatch による自動再ビルド（アルプススタンドにはあるが、2週間イベントには過剰）
- チーム編成表示は**未発表**のため v1 では「Coming Soon」枠のみ。発表後に data 追記
- 多言語対応

## マイルストーン

| 期日 | 内容 |
|---|---|
| 〜7/17 | Codex 実装（scaffold→ページ→Worker） |
| 7/18 19:00 | **初回練習配信までに公開**（最低限: トップ+スケジュール+検知） |
| 〜7/22 | /endfield ページ・磨き込み |
| 7/28 21:00 | 本戦。当日はトップを本戦モード表示に |
| 7/29〜 | アーカイブ静的化、Cron停止（クォータ節約） |
