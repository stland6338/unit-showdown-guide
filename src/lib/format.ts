import type { ShowdownStream } from "./types";

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTimeJst(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTimelineDate(iso: string) {
  return {
    date: dateFormatter.format(new Date(iso)).replace("/", "."),
    weekday: weekdayFormatter.format(new Date(iso)).toUpperCase(),
  };
}

export function formatTimeJst(iso: string) {
  return timeFormatter.format(new Date(iso));
}

export function groupStreamsByDay(streams: ShowdownStream[]) {
  const groups = new Map<string, ShowdownStream[]>();
  for (const stream of streams) {
    const key = stream.scheduledStartTime.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), stream]);
  }
  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

export function streamHref(stream: Pick<ShowdownStream, "videoId" | "channelUrl" | "liverName">) {
  if (stream.videoId) return `https://www.youtube.com/watch?v=${stream.videoId}`;
  if (stream.channelUrl) return stream.channelUrl;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${stream.liverName} にじさんじ`)}`;
}
