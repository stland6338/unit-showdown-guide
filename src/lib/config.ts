export const config = {
  siteUrl: "https://unit-showdown-guide.pages.dev",
  liveApiUrl: process.env.NEXT_PUBLIC_LIVE_API_URL?.trim() ?? "",
  contactUrl: "https://github.com/stland6338/unit-showdown-guide/issues/new/choose",
} as const;
