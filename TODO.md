# TODO — 実装チェックリスト（Codex 用）

期限感: **7/18(土) 19:00 の初回練習配信までに Phase 1–4 を公開**（PLAN.md マイルストーン参照）。

## Phase 1: Scaffold
- [x] Next.js 14 + TypeScript + Tailwind を `output: "export"` で初期化（アルプススタンド2026 の config 流用）
- [x] `docs/DESIGN.md` のトークンを `tailwind.config.ts` に登録、Google Fonts 3書体を `next/font/google` で設定
- [x] `src/lib/types.ts`（SPEC.md §2 の型）、`data/*.json` の読み込み層 `src/lib/data.ts`
- [x] `scripts/check-data.mjs`（スキーマ検証）を作成し `npm run build` の前段に組み込み

## Phase 2: ページ実装（カンプ `design/mockup.html` に合わせる）
- [x] 共通レイアウト（非公式帯・ヘッダー・ハザード区切り・フッター免責）
- [x] `/` トップ: Hero + カウントダウン + LiveSlots + スケジュール抜粋 + 本戦パネル + Endfield 概要
- [x] `/schedule`: 全15件（練習14 + 本戦）のタイムライン
- [x] `/endfield`: `data/endfield-facts.json` から生成、情報源ラベル表示
- [x] メタデータ（OGP・sitemap・title）。`metadataBase` は pages.dev URL

## Phase 3: 配信検知
- [x] 14名の channelId 収集 → `data/schedule.seed.json` 更新（AGENTS.md 調査タスク参照）
- [x] `cloudflare/live-worker.js` をアルプススタンドから流用改変（SPEC.md §3 の差分表）
- [x] `wrangler-live.toml` 作成、専用KV `SHOWDOWN_LIVE_KV` を `LIVE_KV` として設定
- [x] 専用Google Cloudプロジェクトで `YOUTUBE_API_KEY` を作成し、Worker secretへ設定
- [x] `LiveSlots.tsx` ポーリング実装（5分 + visibilitychange、失敗時フォールバック）
- [x] Worker デプロイ → GitHub variable `NEXT_PUBLIC_LIVE_API_URL` に本番URLを設定

## Phase 4: 公開
- [x] GitHub リポジトリ作成、`daily-deploy.yml` 流用（project-name: unit-showdown-guide）
- [x] Cloudflare Pages 初回デプロイ、本番URL確認
- [ ] SPEC.md §5 の受け入れ条件 6項目をすべて確認

> 2026-07-16: KV・Worker・Pages・GitHub リポジトリ・YouTube API専用キーの作成と初回公開まで完了。
> 2026-07-16 追記: `CLOUDFLARE_API_TOKEN`（Cloudflareダッシュボードで `unit-showdown-ci` トークンを新規発行、Cloudflare Pages:編集 権限）を GitHub secret に設定し、workflow_dispatch でデプロイ成功を確認済み（run 29486523509）。残りは実LIVE判定テストのみ。

## Phase 5: 運用（イベント中）
- [x] 配信枠URLが立ち次第 `videoId` を追記（直リンク化）
- [x] チーム編成発表 → `data/event.json` の `teams` へ追記、本戦パネル更新
- [x] 7/28 本戦 → 地震により延期（公式ポスト 2082054214457684201）。延期表示・OG 文言・ライブ枠非表示で対応
- [x] 振替日程 **8/18(火) 21:00** 発表（公式ポスト 2088083337810456868 / 2026-08-17 確認）→ 振替決定モードへ切替
  - event.json `postponement.rescheduled` / `mainMatch.datetime`、seed の main `videoId: A7lY0WOsH8M`（新待機所・夢追翔ch）
  - Countdown を data 駆動化、ライブ枠復帰、お知らせ帯を「振替決定」に、8/16 事前計測4名（鏑木ろこ・綺沙良・倉持めると・珠乃井ナナ）を帯に記載
  - 本戦モード: LiveSlots で本戦 LIVE を最優先 + 同時配信中の他視点リスト、NEXT UP は同日なら本戦優先。og.js も本戦優先・8/18 表記
  - live-worker.js に `PINNED_VIDEOS`（待機所は直近5件のアップロードに埋もれるため固定監視）
- [x] ~~要デプロイ~~ → 2026-08-18 の閉鎖デプロイに含めて反映済み（cron は同時に停止）
- [ ] ~~8/18 本戦当日: `/api/live` で本戦 LIVE 検知と ON AIR 表示を確認~~（閉鎖のため対象外）

## Phase 6: 閉鎖（2026-08-18）
- [x] `src/lib/config.ts` の `siteClosed: true` で全ページを「公開終了」案内に差し替え（ナビ非表示・OGP は summary・sitemap は `/` のみ・`public/_redirects` で旧ページ→`/`）
- [x] `showdown-sentinel` / `showdown-live` の cron を `crons = []` で停止して再デプロイ（Worker 本体・KV・secrets は残置。`/api/live` は KV キャッシュを返すだけ）
- [x] `.github/workflows/daily-deploy.yml` の毎朝 schedule を停止（push / workflow_dispatch は残す）
- 復元手順: `siteClosed: false` → 両 toml の crons を戻す → `npx wrangler deploy -c wrangler-*.toml` → push
- 完全撤去する場合: `npx wrangler pages project delete unit-showdown-guide` / `npx wrangler delete -c wrangler-live.toml` / `npx wrangler delete -c wrangler-sentinel.toml` / KV 2 つ削除 / GitHub リポジトリをアーカイブ / GCP `unit-showdown-guide-2026` の API キー無効化

## 人間（とらんど）の承認が必要なもの
- [x] `YOUTUBE_API_KEY` の安全な作成・Worker secret設定
- [x] GitHub Actions 用 `CLOUDFLARE_API_TOKEN` の安全な入力（2026-07-16 完了、専用トークン unit-showdown-ci）
- [ ] `endfield-facts.json` の `verified: false` → `true` 昇格の最終確認
