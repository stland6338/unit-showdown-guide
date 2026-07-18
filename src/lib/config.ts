const liveApiUrl = process.env.NEXT_PUBLIC_LIVE_API_URL?.trim() ?? "";

export const config = {
  siteUrl: "https://unit-showdown-guide.pages.dev",
  liveApiUrl,
  /** 動的OGP画像。Worker の /og（liveApiUrl と同一オリジン） */
  ogImageUrl: liveApiUrl ? liveApiUrl.replace(/\/api\/live\/?$/, "/og") : "",
  /** Googleフォームの回答URL。scripts/create-contact-form.gs で作成後にここへ設定（空なら「準備中」表示） */
  contactUrl: "",
} as const;
