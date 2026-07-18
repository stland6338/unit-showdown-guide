"use client";

import { Avatar } from "./Avatar";
import { useLivePayload } from "./LiveSlots";
import { formatTimeJst, formatTimelineDate, groupStreamsByDay } from "@/lib/format";
import { mergeStream } from "@/lib/merge";
import type { Announcement, ShowdownStream } from "@/lib/types";

/** 配信告知を優先して本人ポストを1件選ぶ */
function pickAnnouncement(announcements: Announcement[] | undefined) {
  if (!announcements?.length) return null;
  return announcements.find((a) => a.label === "配信告知") ?? announcements[0];
}

/**
 * トップの練習スケジュール抜粋。Worker検知とマージするため、
 * 配信枠が公開されると YouTube リンクが自動で枠直リンクに切り替わる。
 */
export function TimelinePreview({ endpoint, streams, days }: { endpoint: string; streams: ShowdownStream[]; days: number }) {
  const payload = useLivePayload(endpoint);
  const merged = streams.map((stream) => mergeStream(stream, payload?.streams ?? [], payload?.recentArchives ?? []));
  const groups = groupStreamsByDay(merged).slice(0, days);

  return (
    <div className="tl">
      {groups.map((group) => {
        const date = formatTimelineDate(group.items[0].scheduledStartTime);
        return (
          <div className="tl-day" key={group.date}>
            <div className="tl-date">
              {date.date} <span className="dow">{date.weekday}</span>
            </div>
            <div className="tl-items">
              {group.items.map((stream) => {
                const announcement = pickAnnouncement(stream.announcements);
                const youtubeHref = stream.videoId
                  ? `https://www.youtube.com/watch?v=${stream.videoId}`
                  : stream.channelUrl;
                return (
                  <div className={`tl-item ${stream.liveStatus === "live" ? "tl-item--live" : ""}`} key={stream.id}>
                    <span className="tl-time">{formatTimeJst(stream.scheduledStartTime)}</span>
                    <Avatar src={stream.channelIcon} size={32} />
                    <span className="tl-name">{stream.liverName}</span>
                    <span className="tl-links">
                      {youtubeHref && (
                        <a
                          className={`tl-link ${stream.videoId ? "tl-link--frame" : ""}`}
                          href={youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${stream.liverName}のYouTube${stream.videoId ? "配信枠" : "チャンネル"}`}
                        >
                          {stream.liveStatus === "live" ? "▶ LIVE" : stream.videoId ? "▶ 配信枠" : "▶ CH"}
                        </a>
                      )}
                      {announcement && (
                        <a
                          className="tl-link"
                          href={announcement.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${stream.liverName}の${announcement.label}をXで見る`}
                        >
                          𝕏 告知
                        </a>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
