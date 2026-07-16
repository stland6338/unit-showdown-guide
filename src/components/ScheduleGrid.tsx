"use client";

import { Avatar } from "./Avatar";
import { useLivePayload } from "./LiveSlots";
import { formatDateTimeJst, streamHref } from "@/lib/format";
import type { LiveItem, RecentArchiveItem, ShowdownStream } from "@/lib/types";

const statusLabel = { live: "LIVE", upcoming: "UPCOMING", archived: "ARCHIVE" } as const;

function mergeStream(
  stream: ShowdownStream,
  active: LiveItem[],
  archives: RecentArchiveItem[]
): ShowdownStream & { title?: string } {
  const live = active.find(
    (item) => item.streamId === stream.id || item.videoId === stream.videoId || item.channelId === stream.channelId
  );
  if (live) {
    return {
      ...stream,
      videoId: live.videoId,
      liveStatus: live.liveStatus,
      scheduledStartTime: live.actualStartTime ?? live.scheduledStartTime ?? stream.scheduledStartTime,
      title: live.title,
    };
  }
  const archive = archives.find(
    (item) => item.streamId === stream.id || item.videoId === stream.videoId || item.channelId === stream.channelId
  );
  if (archive) return { ...stream, videoId: archive.videoId, liveStatus: "archived", title: archive.title };
  return stream;
}

export function ScheduleGrid({ endpoint, streams }: { endpoint: string; streams: ShowdownStream[] }) {
  const payload = useLivePayload(endpoint);
  const merged = streams.map((stream) => mergeStream(stream, payload?.streams ?? [], payload?.recentArchives ?? []));

  return (
    <div className="stream-grid">
      {merged.map((stream, index) => {
        const href = streamHref(stream);
        const isLive = stream.liveStatus === "live";
        return (
          <article className={`stream-card ${isLive ? "stream-card--live" : ""}`} key={stream.id}>
            <div className="stream-card-topline">
              <span className={`status status--${stream.liveStatus}`}>{statusLabel[stream.liveStatus]}</span>
              <span className="stream-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
            {stream.videoId && (
              <a className="stream-thumb" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${stream.liverName}の配信をYouTubeで見る`}>
                <img src={`https://i.ytimg.com/vi/${stream.videoId}/hqdefault.jpg`} alt={`${stream.liverName}のYouTube配信サムネイル`} loading="lazy" referrerPolicy="no-referrer" />
              </a>
            )}
            <p className="stream-kind">{stream.kind === "main" ? "MAIN MATCH" : "PRACTICE STREAM"}</p>
            <a className="stream-head" href={stream.channelUrl ?? href} target="_blank" rel="noopener noreferrer">
              <Avatar src={stream.channelIcon} size={40} />
              <h2>{stream.liverName}</h2>
            </a>
            <p className="stream-card-title">{stream.title ?? (stream.kind === "main" ? "UNIT SHOWDOWN 本戦" : "練習配信")}</p>
            <time dateTime={stream.scheduledStartTime}>{formatDateTimeJst(stream.scheduledStartTime)} JST</time>
            <a className="card-link" href={href} target="_blank" rel="noopener noreferrer">
              {stream.videoId ? "YouTubeで見る" : stream.kind === "main" ? "公式情報を確認" : "チャンネルへ"} →
            </a>
          </article>
        );
      })}
    </div>
  );
}
