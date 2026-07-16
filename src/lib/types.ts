export type LiveStatus = "upcoming" | "live" | "archived";
export type SourceLabel = "official" | "wiki" | "stream" | "ai_extracted" | "editor";

export interface ShowdownStream {
  id: string;
  liverName: string;
  channelId: string | null;
  channelUrl: string | null;
  /** YouTubeチャンネルアイコンURL。チャンネルリンクの一部としてのみ表示する（README 絶対条件参照） */
  channelIcon?: string | null;
  videoId: string | null;
  kind: "practice" | "main";
  scheduledStartTime: string;
  liveStatus: LiveStatus;
  source: SourceLabel;
  verified: boolean;
}

export interface EventSource {
  label: string;
  url: string;
  checkedAt: string;
}

export interface EventData {
  name: string;
  hashtags: string[];
  isPr: boolean;
  occasion: string;
  mainMatch: {
    datetime: string;
    format: string;
    prize: string;
    teams: unknown;
    teamsNote: string;
  };
  practicePeriod: { start: string; end: string; liverCount: number };
  substitution: string;
  gameDownloadUrl: string;
  sources: EventSource[];
  source: SourceLabel;
  verified: boolean;
}

export interface EndfieldFact {
  key: string;
  label: string;
  value: string;
  note?: string;
  source: SourceLabel;
  verified: boolean;
  checkedAt?: string;
  sourceUrl?: string;
}

export interface OfficialLink {
  label: string;
  url: string;
}

export interface LiveItem {
  videoId: string;
  channelId: string;
  streamId?: string | null;
  liverName: string;
  title: string;
  liveStatus: "live" | "upcoming";
  scheduledStartTime: string | null;
  actualStartTime: string | null;
}

export interface RecentArchiveItem {
  videoId: string;
  channelId: string;
  streamId?: string | null;
  liverName: string;
  title: string;
  publishedAt: string;
  actualStartTime: string | null;
  actualEndTime: string;
}

export interface LivePayload {
  generatedAt: string | null;
  streams: LiveItem[];
  recentArchives: RecentArchiveItem[];
}
