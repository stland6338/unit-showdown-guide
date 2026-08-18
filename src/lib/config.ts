const liveApiUrl = process.env.NEXT_PUBLIC_LIVE_API_URL?.trim() ?? "";

/**
 * サイト閉鎖モード（2026-08-18 公開終了）。
 * true の間は全ページが「公開終了」案内になり、ライブ検知・動的 OGP を参照しない。
 * 復元するときは false に戻し、wrangler-*.toml の crons を復活させて再デプロイする。
 */
const siteClosed: boolean = true;

export const config = {
  siteUrl: "https://unit-showdown-guide.pages.dev",
  siteClosed,
  liveApiUrl,
  /** 動的OGP画像。Worker の /og（liveApiUrl と同一オリジン）。閉鎖中は使わない */
  ogImageUrl: liveApiUrl && !siteClosed ? liveApiUrl.replace(/\/api\/live\/?$/, "/og") : "",
  /** お問い合わせGoogleフォームの回答URL（空なら「準備中」表示） */
  contactUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdxxSepFOnFUDiUhzj0zlKj_hrwbn2iv7l0b_6Ec611Mlt7Gg/viewform",
} as const;
