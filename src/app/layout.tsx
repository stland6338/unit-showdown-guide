import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { config } from "@/lib/config";
import "./globals.css";

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  // 日本語フォントは多数のunicode-rangeへ分割されるため、400をセルフホストし太字はCSSで合成する。
  weight: "400",
  variable: "--font-body",
  display: "swap",
  preload: false,
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_NAME = "にじユニショーダウン 非公式観戦ガイド";
// 閉鎖中は title / description / OGP を「公開終了」に切り替える（動的 OGP 画像は config 側で空になる）
const defaultTitle = config.siteClosed ? `${SITE_NAME}（公開終了）` : SITE_NAME;
const description = config.siteClosed
  ? "にじユニショーダウン 非公式観戦ガイドは 2026年8月18日 をもって公開を終了しました。ご覧いただきありがとうございました。"
  : "エンドフィールド×にじさんじ UNIT SHOWDOWNの非公式観戦ガイド。練習配信スケジュールと本戦情報をまとめています。";
const socialDescription = config.siteClosed
  ? description
  : "14名の練習配信と本戦情報を追える、非公式の観戦ガイド。本戦は 8/18(火) 21:00 に振替開催。";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: defaultTitle,
    description: socialDescription,
    url: config.siteUrl,
    ...(config.ogImageUrl ? { images: [{ url: config.ogImageUrl, width: 1200, height: 630 }] } : {}),
  },
  twitter: {
    card: config.ogImageUrl ? "summary_large_image" : "summary",
    title: defaultTitle,
    description: socialDescription,
    ...(config.ogImageUrl ? { images: [config.ogImageUrl] } : {}),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
