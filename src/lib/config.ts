const liveApiUrl = process.env.NEXT_PUBLIC_LIVE_API_URL?.trim() ?? "";

export const config = {
  siteUrl: "https://unit-showdown-guide.pages.dev",
  liveApiUrl,
  /** 動的OGP画像。Worker の /og（liveApiUrl と同一オリジン） */
  ogImageUrl: liveApiUrl ? liveApiUrl.replace(/\/api\/live\/?$/, "/og") : "",
  contactUrl: "https://github.com/stland6338/unit-showdown-guide/issues/new/choose",
} as const;
