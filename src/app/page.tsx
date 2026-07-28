import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Countdown } from "@/components/Countdown";
import { LiveSlots } from "@/components/LiveSlots";
import { ShareButton } from "@/components/ShareButton";
import { TimelinePreview } from "@/components/TimelinePreview";
import { TweetEmbed } from "@/components/TweetEmbed";
import { Hazard, SectionHeading } from "@/components/SiteChrome";
import { config } from "@/lib/config";
import { getEvent, getFact, getStreams } from "@/lib/data";

export default function HomePage() {
  const event = getEvent();
  const streams = getStreams();
  const practice = streams.filter((stream) => stream.kind === "practice");
  const streamById = new Map(streams.map((stream) => [stream.id, stream]));
  const genre = getFact("genre");
  const release = getFact("release");
  const platforms = getFact("platforms");
  const currentVersion = getFact("currentVersion");

  const postponement = event.postponement?.postponed ? event.postponement : null;

  return (
    <>
      {postponement && (
        <div className="notice-strip" role="status">
          <div className="wrap">
            <span className="notice-badge">延期</span>
            <p>
              {postponement.originalDatetimeLabel} 開催予定だった本戦は、{postponement.reason}により延期となりました。
              {postponement.rescheduleNote}です。
            </p>
            <a href={postponement.sourceUrl} target="_blank" rel="noopener noreferrer">
              公式のお知らせ（{postponement.checkedAt} 確認）→
            </a>
          </div>
        </div>
      )}
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
            <span className="stroke">Nijisanji</span>
            <span className="fill">Unit Showdown</span>
            <span className="title-badge">Unofficial Fan Guide — 非公式観戦ガイド</span>
          </h1>
          <p className="title-ja">
            にじさんじライバー14名による <em>チーム対抗大会</em> 非公式観戦ガイド
          </p>
          <div className="hero-meta">
            {postponement ? (
              <span>本戦 <b>延期</b>（日程後日発表）</span>
            ) : (
              <span>本戦 <b>7/28 (火) 21:00</b> JST</span>
            )}
            <span>練習配信 <b>7/18 – 7/27</b></span>
            <span>参加 <b>14</b> LIVERS</span>
          </div>
          <div className="hero-row">
            <Countdown postponed={Boolean(postponement)} />
            <aside className="collab-card" aria-label="コラボ企画の概要">
              <div className="collab-label">COLLABORATION — コラボ企画</div>
              <div className="collab-pair">
                <div className="collab-side">
                  <b>にじさんじ</b>
                  <span>VTuberグループ<br />ライバー14名が参戦</span>
                </div>
                <div className="collab-x" aria-hidden>×</div>
                <div className="collab-side">
                  <b>アークナイツ：<br />エンドフィールド</b>
                  <span>3Dリアルタイム戦略RPG<br />ハーフアニバーサリー記念</span>
                </div>
              </div>
              <a className="collab-link" href={event.gameDownloadUrl} target="_blank" rel="noopener noreferrer">
                ゲーム公式サイト →
              </a>
            </aside>
          </div>
          <div className="hero-actions">
            <ShareButton />
          </div>
        </div>
      </div>

      <Hazard thin />

      {/* 延期発表中はライブ枠の露出を止める（postponement 解消で自動復帰） */}
      {!postponement && (
        <section id="live">
          <div className="wrap">
            <SectionHeading number="SEC.01" title="Now Live / Next Up" japanese="いまやってる配信・次の配信" />
            <LiveSlots endpoint={config.liveApiUrl} staticStreams={streams} />
          </div>
        </section>
      )}

      <section id="schedule">
        <div className="wrap">
          <SectionHeading number="SEC.02" title="Practice Schedule" japanese="練習配信スケジュール（抜粋）" />
          <TimelinePreview endpoint={config.liveApiUrl} streams={practice} days={3} />
          <Link className="more-link" href="/schedule/">全14配信 + 本戦のスケジュールを見る →</Link>
        </div>
      </section>

      <section id="main">
        <div className="wrap">
          <SectionHeading number="SEC.03" title="Main Match" japanese="本戦情報" />
          <div className="main-match">
            <div className="mm-grid">
              <div className="mm-cell">
                <div className="k">DATE / START</div>
                {postponement ? (
                  <div className="v">延期 <small>日程は後日発表（当初 {postponement.originalDatetimeLabel}）</small></div>
                ) : (
                  <div className="v">7.28 <small>(火) 21:00 JST</small></div>
                )}
              </div>
              <div className="mm-cell"><div className="k">FORMAT</div><div className="v">チーム対抗<small> 大会配信</small></div></div>
              <div className="mm-cell"><div className="k">PRIZE</div><div className="v">豪華賞品<small> 優勝チームへ</small></div></div>
            </div>
            {event.rules && (
              <div className="rules">
                <div className="casters-label">RULES — 全体ルール（公式解説スライドより）</div>
                <dl className="rules-overall">
                  {event.rules.overall.map((item) => (
                    <div className="rule-item" key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.value}
                        {item.note && <small>（{item.note}）</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="rules-rounds">
                  {event.rules.rounds.map((round) => (
                    <div className="rule-round" key={round.round}>
                      <div className="rr-head">
                        <span className="rr-no">ROUND {round.round}</span>
                        <span className={`rr-format${round.format === "個人戦" ? " rr-format--solo" : ""}`}>
                          {round.format}
                        </span>
                      </div>
                      <div className="rr-name">{round.name}</div>
                      <div className="rr-meta">
                        制限時間 <b>{round.timeLimit}</b>
                      </div>
                      <p className="rr-detail">{round.detail}</p>
                      {round.stages && (
                        <ol className="rr-stages">
                          {round.stages.map((stage) => (
                            <li key={stage}>{stage}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {event.casters && (
              <div className="casters">
                <div className="casters-label">MC / 解説</div>
                <ul>
                  {event.casters.items.map((caster) => (
                    <li key={caster.name}>
                      <a href={caster.tweetUrl} target="_blank" rel="noopener noreferrer" title="本人の告知ポストを見る">
                        <span className="caster-role">{caster.role}</span>
                        <span className="caster-name">{caster.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {event.teams ? (
              <div className="teams">
                <div className="casters-label">TEAM ROSTER — {event.mainMatch.teamsNote}</div>
                <div className="teams-vs">
                  {event.teams.items.map((team, index) => (
                    <div className="team" key={team.id}>
                      {index > 0 && <div className="team-vs-mark" aria-hidden>VS</div>}
                      <div className="team-name">{team.name}</div>
                      <div className="team-caption">{team.caption}</div>
                      <ul className="team-members">
                        {team.memberIds.map((memberId) => {
                          const member = streamById.get(memberId);
                          if (!member) return null;
                          return (
                            <li key={memberId}>
                              <a href={member.channelUrl ?? "#"} target="_blank" rel="noopener noreferrer" title={member.liverName}>
                                <Avatar src={member.channelIcon} size={44} />
                                <span>{member.liverName}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="teams-note">※構図は各配信・告知からの確認情報。{event.substitution}（公式発表）</p>
              </div>
            ) : (
              <div className="coming">
                <b>TEAM ROSTER — 発表待ち。</b> {event.mainMatch.teamsNote}。{event.substitution}（公式発表）
              </div>
            )}
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
