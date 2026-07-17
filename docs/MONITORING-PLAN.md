# MONITORING — AI外形監視「sentinel」方針

## Context

unit-showdown-guide の外形監視を、閾値ベースの死活監視でなく **AIエージェントによる状態判断** で行う。
「ページを実際にブラウザで開いて証拠を集め、AIが healthy / degraded / down を判定し、結果をメールで報告する」を Cloudflare 内で完結させる。イベント期間（〜7/29）が主戦場のため、シンプルさと即応性を優先する。

## 全体アーキテクチャ

```
Cloudflare Worker: showdown-sentinel（新規・監視対象と分離）
  Cron: */20 * * * *（配信時間帯 18-16 UTC+9 は */10 に強化）
    │
    ├─ 1) Browser Rendering で証拠収集
    │     ・トップ / /schedule/ を実ブラウザで開く
    │     ・スクリーンショット・DOMテキスト・console・応答時間
    │     ・/api/live と /og は fetch で直接検査
    │
    ├─ 2) Workers AI が判定
    │     ・証拠バンドル(JSON)をLLMに渡し
    │       {status, reasons[], summary} を構造化出力
    │
    ├─ 3) メール送信（毎チェック）
    │     ・件名: [SENTINEL][{STATUS}] unit-showdown-guide HH:mm
    │
    └─ 状態: SENTINEL_KV（前回状態・履歴30件）/ スクショは R2（任意）
```

**分離原則**: showdown-live（監視対象の一部）とは別 Worker・別KVにする。監視系が監視対象と運命を共にしない。

## 1. 証拠収集（Browser Rendering）

`@cloudflare/puppeteer`（browser binding）でトップページを実際に開き、以下を収集:

| 証拠 | 取得方法 | 意味 |
|---|---|---|
| HTTPステータス / 応答時間 | `page.goto()` の response | 死活・性能 |
| スクリーンショット | `page.screenshot()` | 視覚的証拠（R2保存・メール添付は任意） |
| 非公式帯の存在 | DOMテキストに「非公式のファンサイト」 | コンプライアンス表示の欠落検知 |
| LIVE枠の描画 | `#live` セクションのテキスト | JSポーリングの動作 |
| カウントダウン | `#cd` 相当の数字が0でない/描画済み | クライアントJS実行 |
| console エラー | `page.on("console")` | フロント破損 |
| `/api/live` | fetch。JSONスキーマ + `generatedAt` の鮮度（20分以内） | 検知Worker/Cron/YouTube APIの健全性 |
| `/og` | fetch。200 + `image/png` + サイズ>10KB | OGPカードの生存 |

**注**: 収集は素の puppeteer コードで決定的に行い、失敗も証拠として記録する（収集失敗 ≠ 即down。AIに判断材料として渡す）。

## 2. AI判定（Workers AI）

- モデル: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`（JSON mode / 構造化出力対応のテキストモデル。視覚判定はv2で検討）
- 入力: 証拠バンドル（上表のJSON）+ 判定基準（下記ルーブリック）
- 出力（JSON強制）: `{ "status": "healthy|degraded|down", "reasons": ["…"], "summary": "日本語1-2文" }`

### ルーブリック（プロンプトに埋め込む）

- **down**: トップページが開けない / 5xx / 本文が実質空（タイトル・非公式帯とも欠落）
- **degraded**: ページは見えるが、①`/api/live` が停止・20分超の鮮度切れ ②`/og` 異常 ③consoleに継続的エラー ④非公式帯欠落 ⑤応答>5s のいずれか
- **healthy**: 上記なし

**AIを使う意味**: 単一指標の閾値でなく、複合的な証拠から「利用者にとってサイトが機能しているか」を文章で説明させる点。判定と同時に人間が読める診断文（summary/reasons）が毎回得られる。
**ガードレール**: AI出力が不正・タイムアウト時は決定的フォールバック（HTTP失敗=down / 検査1つでも失敗=degraded）で判定し、メールに「AI判定失敗・機械判定」と明記。判定の最終防衛線をAIに依存させない。

## 3. メール送信（毎チェック）

- ユーザー指定どおり**毎チェック送信**（*/20 → 72通/日。多ければ `MAIL_MODE=change` で状態変化時+日次サマリに切替できる設計にしておく）
- 本文: AIのsummary / reasons / 主要メトリクス表 / スクショURL（R2保存時）/ 前回からの変化
- 件名例: `[SENTINEL][HEALTHY] unit-showdown-guide 21:40 (prev: HEALTHY)`

### 送信手段（要決定）

| 案 | 条件 | 推奨度 |
|---|---|---|
| **Resend API** | APIキーのみ（無料100通/日）。宛先 s7015518@gmail.com | ◎ 独自ドメイン不要で最速 |
| Cloudflare Email Workers (`send_email` binding) | Email Routing 設定済みの独自ドメインが必要 | ○ ドメインがあるなら純正 |

v1 は Resend を採用（`RESEND_API_KEY` を Worker secret へ）。100通/日制限内に収まるよう cron は */20 が上限。

## コスト・クォータ試算

| リソース | 使用量/日 | 無料枠 | 判定 |
|---|---|---|---|
| Browser Rendering | 72回 × ~7秒 ≈ 8.4分 | 10分/日（Freeプラン） | ⚠ ギリギリ。超過時は */30 に落とすか Workers Paid（$5/月） |
| Workers AI | 72推論 × 小型入力 | 10,000 Neurons/日 | ✎ 70bモデルは重め。超過するなら `llama-3.1-8b-instruct` に格下げ |
| Resend | 72通 | 100通/日 | OK |
| KV / Cron | 微小 | 無料枠内 | OK |

## 実装構成（Codex向け）

```
cloudflare/sentinel-worker.js   # 収集→判定→送信の本体
wrangler-sentinel.toml          # name=showdown-sentinel, browser binding,
                                # ai binding, SENTINEL_KV, cron, vars(MAIL_MODE)
```

- secrets: `RESEND_API_KEY` / vars: `MAIL_TO`, `MAIL_MODE`
- 手動実行用に `GET /run`（Bearer トークン保護）を用意し、デプロイ直後の動作確認に使う
- エラーハンドリング: 各収集ステップは個別 try-catch で証拠化。メール送信失敗のみ console.error + KV に未送信フラグ（次回に前回分も併記）

## マイルストーン

1. v1（〜7/19）: 上記そのまま。テキスト証拠のみでAI判定
2. v2（任意）: スクショをR2保存しメールにリンク / llava系でスクショの視覚判定を追加
3. 7/29以降: イベント終了とともに cron 停止（sentinel も撤収）

## 決定事項（2026-07-17 とらんど承認）

1. メール送信手段: **Resend**（`RESEND_API_KEY` を Worker secret へ。宛先 = Resend アカウントのメールアドレス）
2. 送信頻度: **変化時 + 日次サマリ**（`MAIL_MODE=change`。毎チェック送信は `MAIL_MODE=every` で切替可）
3. プラン: **無料枠で運用**（cron */20 固定。Browser Rendering 10分/日以内）
