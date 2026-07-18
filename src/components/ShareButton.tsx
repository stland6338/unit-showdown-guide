"use client";

import { openShareIntent } from "@/lib/share";

/** サイト自体を紹介する共有ボタン。配信状況の共有は LiveSlots 内の各枠ボタンが担う */
export function ShareButton() {
  return (
    <button
      type="button"
      className="share-x"
      onClick={() => openShareIntent("エンドフィールド×にじさんじ UNIT SHOWDOWN の非公式観戦ガイド。練習配信スケジュール・本戦情報・LIVE状況をまとめています")}
    >
      <span aria-hidden>𝕏</span> このサイトを共有
    </button>
  );
}
