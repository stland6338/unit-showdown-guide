# AGENTS.md — Codex 実装ハンドオフ

このリポジトリは「にじユニショーダウン非公式観戦ガイド」の**計画・デザインフェーズ完了後**の状態です。あなた（Codex）の仕事はここから実装することです。

## 読む順番

1. `README.md` — 企画概要と絶対条件
2. `docs/PLAN.md` — アーキテクチャと公開計画
3. `docs/SPEC.md` — 機能仕様（これが実装の正）
4. `docs/DESIGN.md` + `design/mockup.html` — デザイン（カンプをブラウザで開いて見た目を合わせる）
5. `TODO.md` — 作業順のチェックリスト

## 参照実装（最重要）

`../アルプススタンド2026/` に同一アーキテクチャの稼働中サイトがある。**新規に書く前に必ず対応ファイルを読み、流用すること**:

| 今回作るもの | 流用元 |
|---|---|
| `next.config.mjs` / `tailwind.config.ts` の骨格 | 同名ファイル |
| `cloudflare/live-worker.js` | `cloudflare/live-worker.js`（785行。SPEC.md の差分表どおり削って改変） |
| `wrangler-live.toml` | 同名ファイル（name と KV id を変更） |
| `src/components/LiveSlots.tsx` のポーリング | 同名ファイル |
| `.github/workflows/daily-deploy.yml` | 同名ファイル（project-name を変更） |
| `scripts/check-data.mjs` | 同名ファイル（スキーマを簡約） |

## 絶対条件（違反 = レビュー差し戻し）

1. 全ページに「非公式」表記（ヘッダー上の黄色帯 + フッター免責。カンプ参照）
2. 公式ロゴ・KV・ライバー画像・ゲームスクリーンショットを使わない
3. `YOUTUBE_API_KEY` は Worker secret のみ。クライアントコード・リポジトリに書かない
4. `data/*.json` の `verified: false` 項目は要確認バッジなしで表示しない
5. ライブ検知の失敗時もサイトが壊れない（フォールバック必須）
6. YouTube サムネイルは元配信へのリンクの一部としてのみ使用（単体掲載禁止）
7. 公式ツイート・公式サイト文面の逐語転載禁止（要約+出典リンク）
8. デザインを公式KVへ寄せる調整禁止（カンプの独自要素のまま実装）
9. 広告・収益化を入れない
10. フッターに問い合わせ導線 + 権利者要請への即応方針を明記（README 絶対条件 9 参照）

## コマンド（実装後に成立させること）

```bash
npm run dev          # 開発サーバー
npm run build        # SSG ビルド（out/ 生成）
npm run lint         # ESLint
node scripts/check-data.mjs   # データ検証
npx wrangler dev -c wrangler-live.toml    # Worker ローカル実行
```

## 実装時の調査タスク

- **参加ライバー14名の YouTube channelId 収集**: にじさんじ公式サイト（nijisanji.jp/talents）の各ライバーページ → YouTubeリンク → チャンネルページの `channel/UC...`。収集後 `data/schedule.seed.json` の `channelId`/`channelUrl` を埋める。UC 形式 24文字であることを check-data.mjs で検証
- **`data/endfield-facts.json` の `verified: false` 項目の裏取り**: 公式サイト endfield.gryphline.com で確認し、確認できたら `verified: true` + 確認日を追記。確認できないものは表示から外す

## やらないこと

- チーム編成の推測記載（未発表。プレースホルダのみ）
- 切り抜き収集・管理画面・多言語（スコープ外、PLAN.md 参照)
- デザインの独自アレンジ（カンプが正。改善提案は実装後に別途）
