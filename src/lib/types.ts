export type LiveStatus = "upcoming" | "live" | "archived";
export type SourceLabel = "official" | "wiki" | "stream" | "ai_extracted" | "editor";

export interface Announcement {
  url: string;
  label: "参加告知" | "配信告知";
}

export interface Caster {
  name: string;
  role: string;
  tweetUrl: string;
}

export interface Team {
  id: string;
  name: string;
  caption: string;
  /** ShowdownStream.id を参照 */
  memberIds: string[];
}

export interface ShowdownStream {
  id: string;
  liverName: string;
  channelId: string | null;
  channelUrl: string | null;
  /** YouTubeチャンネルアイコンURL。チャンネルリンクの一部としてのみ表示する（README 絶対条件参照） */
  channelIcon?: string | null;
  videoId: string | null;
  kind: "practice" | "main";
  /** 延期が発表された枠。scheduledStartTime は当初予定のまま保持する */
  postponed?: boolean;
  scheduledStartTime: string;
  liveStatus: LiveStatus;
  source: SourceLabel;
  verified: boolean;
  /** 本人告知ポストへのリンク（UIでは折りたたみ表示） */
  announcements?: Announcement[];
}

export interface RuleItem {
  label: string;
  value: string;
  note?: string;
}

export interface RuleRound {
  round: number;
  name: string;
  format: "チーム戦" | "個人戦";
  timeLimit: string;
  detail: string;
  stages?: string[];
}

export interface EventSource {
  label: string;
  url: string;
  checkedAt: string;
}

export interface Postponement {
  postponed: boolean;
  /** 当初予定の表示用ラベル（例: 7/28 (火) 21:00） */
  originalDatetimeLabel: string;
  reason: string;
  rescheduleNote: string;
  sourceUrl: string;
  source: SourceLabel;
  verified: boolean;
  checkedAt: string;
}

export interface EventData {
  name: string;
  hashtags: string[];
  isPr: boolean;
  occasion: string;
  postponement?: Postponement;
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
  casters?: {
    items: Caster[];
    source: SourceLabel;
    verified: boolean;
    checkedAt: string;
  };
  rules?: {
    overall: RuleItem[];
    rounds: RuleRound[];
    source: SourceLabel;
    verified: boolean;
    checkedAt: string;
  };
  teams?: {
    items: Team[];
    source: SourceLabel;
    verified: boolean;
    checkedAt: string;
  };
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
