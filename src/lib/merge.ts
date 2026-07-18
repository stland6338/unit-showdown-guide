import type { LiveItem, RecentArchiveItem, ShowdownStream } from "./types";

/**
 * 静的スケジュールに Worker 検知結果を重ねる。
 * 配信枠が立つと /api/live の upcoming に videoId 付きで載るため、
 * これを通すだけで静的データ側の videoId 未設定でも枠リンクが自動反映される。
 */
export function mergeStream(
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
