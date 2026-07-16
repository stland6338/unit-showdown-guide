"use client";

import { useLivePayload } from "./LiveSlots";
import { config } from "@/lib/config";
import { formatDateTimeJst } from "@/lib/format";
import type { ShowdownStream } from "@/lib/types";

/**
 * X共有ボタン。クリック時点の配信状況を本文に反映し、共有URLに
 * キャッシュバスター（?s=）を付けてXに固有URLとしてクロールさせる。
 * これで動的OGP画像（Worker /og）が共有時点の状態でカード化される。
 */
export function ShareButton({ staticStreams }: { staticStreams: ShowdownStream[] }) {
  const payload = useLivePayload(config.liveApiUrl);

  const share = () => {
    const live = (payload?.streams ?? []).filter((item) => item.liveStatus === "live");
    const upcoming = (payload?.streams ?? [])
      .filter((item) => item.liveStatus === "upcoming" && item.scheduledStartTime)
      .sort((a, b) => (a.scheduledStartTime ?? "").localeCompare(b.scheduledStartTime ?? ""))[0];
    const staticNext = staticStreams.find((stream) => Date.parse(stream.scheduledStartTime) > Date.now());

    let text = "エンドフィールド×にじさんじ UNIT SHOWDOWN 非公式観戦ガイド";
    if (live.length > 0) {
      const names = live.slice(0, 3).map((item) => item.liverName).join("・");
      text = `🔴 ${names} が配信中！ #にじユニショーダウン 観戦ガイド`;
    } else if (upcoming) {
      text = `次の配信は ${upcoming.liverName}（${formatDateTimeJst(upcoming.scheduledStartTime ?? "")}〜）#にじユニショーダウン 観戦ガイド`;
    } else if (staticNext) {
      text = `次の配信は ${staticNext.liverName}（${formatDateTimeJst(staticNext.scheduledStartTime)}〜）#にじユニショーダウン 観戦ガイド`;
    }

    const url = new URL("https://x.com/intent/post");
    url.searchParams.set("text", text);
    url.searchParams.set("url", `${config.siteUrl}/?s=${Date.now().toString(36)}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" className="share-x" onClick={share}>
      <span aria-hidden>𝕏</span> このサイトを共有
    </button>
  );
}
