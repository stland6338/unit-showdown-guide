import { config } from "./config";

/**
 * X投稿画面を開く。共有URLに ?s= バスターを付けて毎回固有URLとして
 * クロールさせ、動的OGP画像が共有時点の状態でカード化されるようにする。
 */
export function openShareIntent(text: string) {
  const url = new URL("https://x.com/intent/post");
  url.searchParams.set("text", text);
  url.searchParams.set("url", `${config.siteUrl}/?s=${Date.now().toString(36)}`);
  url.searchParams.set("hashtags", "にじユニショーダウン");
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
