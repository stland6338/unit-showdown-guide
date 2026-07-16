import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Countdown } from "@/components/Countdown";
import { LiveSlots } from "@/components/LiveSlots";
import { TweetEmbed } from "@/components/TweetEmbed";
import { Hazard, SectionHeading } from "@/components/SiteChrome";
import { config } from "@/lib/config";
import { getEvent, getFact, getStreams } from "@/lib/data";
import { formatTimeJst, formatTimelineDate, groupStreamsByDay, streamHref } from "@/lib/format";

export default function HomePage() {
  const event = getEvent();
  const streams = getStreams();
  const practice = streams.filter((stream) => stream.kind === "practice");
  const previewGroups = groupStreamsByDay(practice).slice(0, 3);
  const genre = getFact("genre");
  const release = getFact("release");
  const platforms = getFact("platforms");
  const currentVersion = getFact("currentVersion");

  return (
    <>
      <div className="hero grid-bg">
        <svg className="hero-gear" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth=".6" aria-hidden>
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="12" />
          <path d="M50 4v14M50 82v14M4 50h14M82 50h14M17 17l10 10M73 73l10 10M83 17 73 27M27 73 17 83" />
          <path d="M50 24l22 13v26L50 76 28 63V37z" />
        </svg>
        <div className="wrap">
          <span className="kicker">NIJISANJI × ARKNIGHTS: ENDFIELD — HALF ANNIVERSARY #PR</span>
          <h1 className="title">
            <span className="stroke">Unit</span>
            <span className="fill">Showdown</span>
          </h1>
          <p className="title-ja">
            にじさんじライバー14名による <em>チーム対抗大会</em> 非公式観戦ガイド
          </p>
          <div className="hero-meta">
            <span>本戦 <b>7/28 (火) 21:00</b> JST</span>
            <span>練習配信 <b>7/18 – 7/27</b></span>
            <span>参加 <b>14</b> LIVERS</span>
          </div>
          <Countdown />
        </div>
      </div>

      <Hazard thin />

      <section id="live">
        <div className="wrap">
          <SectionHeading number="SEC.01" title="Now Live / Next Up" japanese="いまやってる配信・次の配信" />
          <LiveSlots endpoint={config.liveApiUrl} staticStreams={streams} />
        </div>
      </section>

      <section id="schedule">
        <div className="wrap">
          <SectionHeading number="SEC.02" title="Practice Schedule" japanese="練習配信スケジュール（抜粋）" />
          <div className="tl">
            {previewGroups.map((group) => {
              const date = formatTimelineDate(group.items[0].scheduledStartTime);
              return (
                <div className="tl-day" key={group.date}>
                  <div className="tl-date">{date.date} <span className="dow">{date.weekday}</span></div>
                  <div className="tl-items">
                    {group.items.map((stream) => (
                      <a className="tl-item" href={streamHref(stream)} target="_blank" rel="noopener noreferrer" key={stream.id}>
                        <span className="tl-time">{formatTimeJst(stream.scheduledStartTime)}</span>
                        <Avatar src={stream.channelIcon} size={32} />
                        <span className="tl-name">{stream.liverName}</span>
                        <span className="tl-arrow">CH →</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Link className="more-link" href="/schedule/">全14配信 + 本戦のスケジュールを見る →</Link>
        </div>
      </section>

      <section id="main">
        <div className="wrap">
          <SectionHeading number="SEC.03" title="Main Match" japanese="本戦情報" />
          <div className="main-match">
            <div className="mm-grid">
              <div className="mm-cell"><div className="k">DATE / START</div><div className="v">7.28 <small>(火) 21:00 JST</small></div></div>
              <div className="mm-cell"><div className="k">FORMAT</div><div className="v">チーム対抗<small> 大会配信</small></div></div>
              <div className="mm-cell"><div className="k">PRIZE</div><div className="v">豪華賞品<small> 優勝チームへ</small></div></div>
            </div>
            <div className="coming">
              <b>TEAM ROSTER — 発表待ち。</b> {event.mainMatch.teamsNote}。{event.substitution}（公式発表）
            </div>
          </div>
        </div>
      </section>

      <section id="source">
        <div className="wrap">
          <SectionHeading number="SEC.04" title="Official Source" japanese="公式発表（X公式埋め込み）" />
          <div className="x-embed-grid">
            {event.sources.map((source) => (
              <TweetEmbed key={source.url} url={source.url} label={source.label} />
            ))}
          </div>
          <p className="sample-note">{"// 本サイトの掲載情報はすべて上記の公式発表に基づきます"}</p>
        </div>
      </section>

      <section id="endfield">
        <div className="wrap">
          <SectionHeading number="SEC.05" title="What is Endfield?" japanese="アークナイツ：エンドフィールドとは" />
          <div className="about-grid">
            <div className="about">
              <p className="lead">{genre?.value}。2026年1月22日に配信開始されたタイトルです。</p>
              <p>{currentVersion?.value}。本企画はハーフアニバーサリー記念施策として開催されます。</p>
              <Link className="more-link" href="/endfield/">ゲーム紹介ページへ →</Link>
            </div>
            <table className="spec-table">
              <tbody>
                <tr><th>GENRE</th><td>{genre?.value}</td></tr>
                <tr><th>PLATFORM</th><td>{platforms?.value}</td></tr>
                <tr><th>RELEASE</th><td>{release?.value}</td></tr>
                <tr><th>GUIDE</th><td>確認済みの公式情報のみ掲載</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
