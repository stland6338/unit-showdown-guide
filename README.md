# にじユニショーダウン 非公式観戦ガイド

「エンドフィールド×にじさんじ UNIT SHOWDOWN」（#にじユニショーダウン）の**非公式**観戦ガイドサイト。
アルプススタンド2026（`../アルプススタンド2026/`）の実証済みアーキテクチャを踏襲する。

## 企画概要（公式発表・2026-07-16確認済み）

- **企画名**: エンドフィールド×にじさんじ UNIT SHOWDOWN（#PR施策）
- **本戦**: 2026-07-28（火）21:00〜 チーム対抗大会配信。優勝チームに豪華賞品
- **趣旨**: 『アークナイツ：エンドフィールド』ハーフアニバーサリー記念
- **練習配信**: 参加ライバー14名が 7/18〜7/27 に各自のYouTubeチャンネルで実施
- **備考**: ルンルンは休養中のため栞葉るりが代理出演
- 情報源: [告知ツイート](https://x.com/nijisanji_app/status/2077574089435406620) / [スケジュールツイート](https://x.com/nijisanji_app/status/2077574182112837889)

## サイトの3本柱

| ページ | 内容 |
|---|---|
| `/`（トップ） | 企画まとめ + いまLIVE + 次の配信 + 本戦カウントダウン |
| `/schedule` | 練習配信スケジュール（14名）+ 配信検知（LIVE/UPCOMING/ARCHIVE） |
| `/endfield` | アークナイツ：エンドフィールドとは（ゲーム紹介） |

## ドキュメント構成

| ファイル | 役割 | 読者 |
|---|---|---|
| [docs/PLAN.md](docs/PLAN.md) | アーキテクチャとCloudflare公開計画 | 全員 |
| [docs/SPEC.md](docs/SPEC.md) | 機能仕様・データスキーマ・Worker API | Codex |
| [docs/DESIGN.md](docs/DESIGN.md) | デザインシステム（Claude Fable 設計） | Codex |
| [design/mockup.html](design/mockup.html) | トップページのデザインカンプ（静的HTML） | Codex |
| [AGENTS.md](AGENTS.md) | Codex 向け実装ハンドオフ指示 | Codex |
| [TODO.md](TODO.md) | 実装チェックリスト | Codex |
| [data/event.json](data/event.json) | 企画データ（情報源ラベル付き） | 実装 |
| [data/schedule.seed.json](data/schedule.seed.json) | 練習配信14件+本戦のシードデータ | 実装 |
| [data/endfield-facts.json](data/endfield-facts.json) | ゲーム紹介ページの事実データ | 実装 |

## 絶対条件（アルプススタンド2026 から継承）

1. サイト全体に「非公式」表記を常時掲示。ANYCOLOR・GRYPHLINE の公式と誤認させない
2. 公式ロゴ・KV画像・ライバー立ち絵・ゲームスクリーンショットを**使用しない**（デザインはモチーフの再解釈のみ）
3. `verified: false` / 情報源ラベル `ai_extracted` のデータは承認バッジなしで表示しない
4. YouTube API キーは Cloudflare Worker の secret にのみ置く（ブラウザに出さない）
