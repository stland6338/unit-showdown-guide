import type { Metadata } from "next";
import { CornerPanel, SectionHeading } from "@/components/SiteChrome";

const CLOSED_TITLE = "公開終了";
const CLOSED_DESCRIPTION = "にじユニショーダウン 非公式観戦ガイドは 2026年8月18日 をもって公開を終了しました。ご覧いただきありがとうございました。";

/** 閉鎖中の全ページ共通メタデータ（layout の title template が付く） */
export const closedMetadata: Metadata = {
  title: CLOSED_TITLE,
  description: CLOSED_DESCRIPTION,
};

/** サイト閉鎖モード（config.siteClosed）で全ページが返す案内 */
export function ClosedNotice() {
  return (
    <>
      <div className="page-hero grid-bg">
        <div className="wrap">
          <span className="kicker">NOTICE / SITE CLOSED</span>
          <SectionHeading number="END" title="Site Closed" japanese="本サイトは公開を終了しました" as="h1" />
          <p className="page-lead">
            にじユニショーダウン 非公式観戦ガイドをご覧いただき、ありがとうございました。
            本サイトは 2026年8月18日 をもって公開を終了しました。
          </p>
        </div>
      </div>
      <section className="page-section">
        <div className="wrap">
          <CornerPanel className="closed-panel">
            <span className="micro-label">OFFICIAL INFORMATION</span>
            <p className="closed-panel-text">
              「エンドフィールド×にじさんじ UNIT SHOWDOWN」に関する最新情報は、にじさんじ公式の告知をご確認ください。
              これまでに参照した公式ポストはページ下部の OFFICIAL SOURCES にまとめています。
            </p>
            <a className="more-link" href="https://x.com/nijisanji_app" target="_blank" rel="noopener noreferrer">
              にじさんじ公式 X（@nijisanji_app）↗
            </a>
          </CornerPanel>
        </div>
      </section>
    </>
  );
}
