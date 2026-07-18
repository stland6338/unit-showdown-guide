const liveApiUrl = process.env.NEXT_PUBLIC_LIVE_API_URL?.trim() ?? "";

export const config = {
  siteUrl: "https://unit-showdown-guide.pages.dev",
  liveApiUrl,
  /** 動的OGP画像。Worker の /og（liveApiUrl と同一オリジン） */
  ogImageUrl: liveApiUrl ? liveApiUrl.replace(/\/api\/live\/?$/, "/og") : "",
  /** お問い合わせGoogleフォームの回答URL（空なら「準備中」表示） */
  contactUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdxxSepFOnFUDiUhzj0zlKj_hrwbn2iv7l0b_6Ec611Mlt7Gg/viewform",
} as const;
