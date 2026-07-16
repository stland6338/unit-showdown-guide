# デプロイ手順（要・人間承認）

この文書のコマンドは、Cloudflare KV 作成・secret 投入・外部デプロイを含みます。`AGENTS.md` の安全基準に従い、**Codex は人間の明示承認を受けるまで実行しません**。

## 現在の公開状態（2026-07-16）

- Pages: https://unit-showdown-guide.pages.dev/
- Worker: https://showdown-live.stland6338.workers.dev/
- KV: `SHOWDOWN_LIVE_KV` を Worker の `LIVE_KV` として設定済み
- GitHub: https://github.com/stland6338/unit-showdown-guide
- 未完了: `YOUTUBE_API_KEY` secret、GitHub Actions 用 `CLOUDFLARE_API_TOKEN`、実LIVE判定

## 事前確認

```bash
npm ci
npm run check:data
npm run typecheck
npm run lint
npm run build
```

`out/` に `/`、`/schedule/`、`/endfield/`、`sitemap.xml` が生成されることを確認します。

## 1. ライブ検知 Worker

1. 新しい環境へ移行する場合だけ KV namespace を作成します。現在の本番環境では作成済みです。

   ```bash
   npx wrangler kv namespace create SHOWDOWN_LIVE_KV -c wrangler-live.toml
   ```

2. 出力された namespace ID を `wrangler-live.toml` の `LIVE_KV` に設定します。
3. YouTube Data API キーを Worker secret として対話入力します。キーをファイル、シェル履歴、クライアント環境変数へ書きません。

   ```bash
   npx wrangler secret put YOUTUBE_API_KEY -c wrangler-live.toml
   ```

4. Worker をデプロイします。

   ```bash
   npx wrangler deploy -c wrangler-live.toml
   ```

5. 発行された URL の `/api/live` が `generatedAt`、`streams`、`recentArchives` を返すことを確認します。

## 2. Cloudflare Pages

1. GitHub に `unit-showdown-guide` リポジトリを作成します。
2. Cloudflare Pages に同名プロジェクトを作成します。
3. GitHub Actions に次を設定します。

   - Secrets: `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
   - Variable: `NEXT_PUBLIC_LIVE_API_URL`（Worker の `/api/live` URL）

4. `.github/workflows/daily-deploy.yml` を `workflow_dispatch` で初回実行します。
5. `https://unit-showdown-guide.pages.dev` の3ページ、モバイル表示、配信フォールバック、問い合わせリンクを確認します。

## 3. 公開後の実配信確認

- YouTube 上で関連配信が `upcoming` または `live` になったとき、Worker のレスポンスに対象枠だけが含まれる。
- トップとスケジュールに LIVE / UPCOMING が反映され、サムネイル全体が元配信へのリンクになっている。
- Worker を停止・通信失敗させても静的スケジュールが残る。
- `YOUTUBE_API_KEY` が Pages の JavaScript、HTML、Git 履歴に含まれない。
