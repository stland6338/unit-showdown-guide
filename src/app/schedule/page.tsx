import type { Metadata } from "next";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { SectionHeading } from "@/components/SiteChrome";
import { config } from "@/lib/config";
import { getStreams } from "@/lib/data";

export const metadata: Metadata = {
  title: "配信スケジュール",
  description: "UNIT SHOWDOWNの練習配信14件と本戦を、LIVE・UPCOMING・ARCHIVEの状態つきで一覧表示します。",
};

export default function SchedulePage() {
  const streams = getStreams();
  return (
    <>
      <div className="page-hero grid-bg">
        <div className="wrap">
          <span className="kicker">OPERATION LOG / ALL STREAMS</span>
          <SectionHeading number="PAGE.01" title="Schedule" japanese="練習配信14件 + 本戦" as="h1" />
          <p className="page-lead">日時はすべて日本時間（JST）。配信枠が確認できたものはYouTubeへ直接リンクします。</p>
        </div>
      </div>
      <section className="page-section">
        <div className="wrap">
          <div className="legend" aria-label="配信ステータスの凡例">
            <span><i className="legend-live" /> LIVE</span>
            <span><i className="legend-upcoming" /> UPCOMING</span>
            <span><i className="legend-archive" /> ARCHIVE</span>
          </div>
          <ScheduleGrid endpoint={config.liveApiUrl} streams={streams} />
          <p className="data-note">{"// 配信状況は5分間隔で更新。取得できない場合も静的スケジュールを表示します。"}</p>
        </div>
      </section>
    </>
  );
}
