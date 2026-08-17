"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { formatDateTimeJst, streamHref } from "@/lib/format";
import { openShareIntent } from "@/lib/share";
import type { LiveItem, LivePayload, ShowdownStream } from "@/lib/types";

function isLivePayload(value: unknown): value is LivePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<LivePayload>;
  return Array.isArray(payload.streams) && (payload.recentArchives === undefined || Array.isArray(payload.recentArchives));
}

/** 参照実装と同じく、マウント時・5分間隔・タブ復帰時に更新する。 */
export function useLivePayload(endpoint: string) {
  const [data, setData] = useState<LivePayload | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) return;
        const json: unknown = await response.json();
        if (alive && isLivePayload(json)) {
          setData({ ...json, recentArchives: json.recentArchives ?? [] });
        }
      } catch {
        // 取得失敗時は前回値または静的フォールバックを維持する。
      }
    };

    void load();
    const timer = window.setInterval(load, 5 * 60 * 1_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endpoint]);

  return data;
}

function dynamicToStream(item: LiveItem, staticStreams: ShowdownStream[]): ShowdownStream {
  const seed = staticStreams.find(
    (stream) => stream.id === item.streamId || stream.videoId === item.videoId || stream.channelId === item.channelId
  );
  return {
    id: seed?.id ?? `live-${item.videoId}`,
    liverName: seed?.liverName ?? item.liverName,
    channelId: item.channelId,
    channelUrl: seed?.channelUrl ?? `https://www.youtube.com/channel/${item.channelId}`,
    channelIcon: seed?.channelIcon ?? null,
    videoId: item.videoId,
    kind: seed?.kind ?? "practice",
    scheduledStartTime: item.actualStartTime ?? item.scheduledStartTime ?? seed?.scheduledStartTime ?? new Date().toISOString(),
    liveStatus: item.liveStatus,
    source: "official",
    verified: true,
  };
}

function StreamSlot({ stream, title, live }: { stream: ShowdownStream; title?: string; live: boolean }) {
  const href = streamHref(stream);
  return (
    <article className={`slot corner ${live ? "slot--live" : "slot--next"}`}>
      <span className="c3" aria-hidden />
      <span className="slot-tag">{live ? "ON AIR" : "NEXT UP"}</span>
      {stream.videoId && (
        <a className="slot-thumb" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${stream.liverName}の配信をYouTubeで見る`}>
          <img src={`https://i.ytimg.com/vi/${stream.videoId}/hqdefault.jpg`} alt={`${stream.liverName}のYouTube配信サムネイル`} loading="lazy" referrerPolicy="no-referrer" />
        </a>
      )}
      <a className="slot-head" href={stream.channelUrl ?? href} target="_blank" rel="noopener noreferrer">
        <Avatar src={stream.channelIcon} size={44} />
        <span className="liver">{stream.liverName}</span>
      </a>
      <div className="stream-title">{title ?? (stream.kind === "main" ? "UNIT SHOWDOWN 本戦" : "練習配信")}</div>
      <div className="when">
        {formatDateTimeJst(stream.scheduledStartTime)} JST {live ? "– LIVE" : "START"}
      </div>
      <div className="slot-actions">
        <a className="cta" href={href} target="_blank" rel="noopener noreferrer">
          {live ? "▶ 視聴する" : stream.videoId ? "▶ 待機所へ" : "チャンネルへ"}
        </a>
        <button
          type="button"
          className="share-mini"
          onClick={() =>
            openShareIntent(
              live
                ? stream.kind === "main"
                  ? "🔴 エンドフィールド×にじさんじ UNIT SHOWDOWN 本戦、配信中！"
                  : `🔴 ${stream.liverName} がエンドフィールド配信中！`
                : `次の配信は ${stream.liverName}（${formatDateTimeJst(stream.scheduledStartTime)}〜）`
            )
          }
        >
          <span aria-hidden>𝕏</span> {live ? "配信中を共有" : "次の予定を共有"}
        </button>
      </div>
    </article>
  );
}

export function LiveSlots({ endpoint, staticStreams }: { endpoint: string; staticStreams: ShowdownStream[] }) {
  const payload = useLivePayload(endpoint);
  const mainStream = staticStreams.find((stream) => stream.kind === "main");
  const isMainItem = (item: LiveItem) =>
    Boolean(mainStream) &&
    (item.streamId === mainStream!.id || item.videoId === mainStream!.videoId || item.channelId === mainStream!.channelId);
  // 本戦モード: 本戦（神視点）が LIVE なら各ライバー視点より優先して ON AIR 枠に出す
  const liveItems = (payload?.streams ?? [])
    .filter((item) => item.liveStatus === "live")
    .sort((a, b) => Number(isMainItem(b)) - Number(isMainItem(a)));
  // NEXT UP: 開始が早い順。同じ日に本戦と各ライバー視点が並ぶ場合は本戦（待機所）を先に出す
  const upcomingKey = (item: LiveItem) => {
    const start = item.scheduledStartTime ?? "9999";
    return `${start.slice(0, 10)}|${isMainItem(item) ? 0 : 1}|${start}`;
  };
  const upcomingItems = (payload?.streams ?? [])
    .filter((item) => item.liveStatus === "upcoming")
    .sort((a, b) => upcomingKey(a).localeCompare(upcomingKey(b)));
  const live = liveItems[0] ? dynamicToStream(liveItems[0], staticStreams) : null;
  // 同時配信中の他視点（本戦当日はライバー各自の視点配信が並ぶ想定）
  const otherLive = liveItems.slice(1).map((item) => ({ item, stream: dynamicToStream(item, staticStreams) }));
  // 延期発表済みの枠は「次の配信」に出さない（延期日発表後に postponed を外して復帰させる）。
  const isPostponed = (item: LiveItem) =>
    staticStreams.some(
      (stream) =>
        stream.postponed &&
        (stream.id === item.streamId || stream.videoId === item.videoId || stream.channelId === item.channelId)
    );
  const workerNext = upcomingItems.find((item) => item.videoId !== live?.videoId && !isPostponed(item));
  const staticNext = staticStreams.find(
    (stream) => stream.liveStatus === "upcoming" && !stream.postponed && stream.id !== live?.id
  );
  const next = workerNext ? dynamicToStream(workerNext, staticStreams) : staticNext ?? null;

  return (
    <>
      <div className="live-board">
        {live ? (
          <StreamSlot stream={live} title={liveItems[0].title} live />
        ) : (
          <div className="slot slot--empty corner">
            <span className="c3" aria-hidden />
            <span className="slot-tag">NOW LIVE</span>
            <div className="liver">STANDBY</div>
            <div className="stream-title">いまLIVE中の関連配信はありません。</div>
            <div className="when">AUTO REFRESH / 5 MIN</div>
          </div>
        )}
        {next ? (
          <StreamSlot stream={next} title={workerNext?.title} live={false} />
        ) : (
          <div className="slot slot--empty corner">
            <span className="c3" aria-hidden />
            <span className="slot-tag">NEXT UP</span>
            <div className="liver">SCHEDULE COMPLETE</div>
            <div className="stream-title">次の配信予定はありません。アーカイブはスケジュールから確認できます。</div>
          </div>
        )}
      </div>
      {otherLive.length > 0 && (
        <div className="live-others" aria-label="同時配信中の他の視点">
          <span className="live-others-label">ALSO LIVE — 他の視点（{otherLive.length}）</span>
          <ul>
            {otherLive.map(({ item, stream }) => (
              <li key={item.videoId}>
                <a href={streamHref(stream)} target="_blank" rel="noopener noreferrer" title={item.title ?? stream.liverName}>
                  <Avatar src={stream.channelIcon} size={28} />
                  <span>{stream.liverName}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="sample-note">
        {`// ${endpoint ? "配信状況は5分間隔で自動更新。取得失敗時は静的スケジュールを維持します" : "ライブ検知は公開準備中。静的スケジュールを表示しています"}`}
      </p>
    </>
  );
}
