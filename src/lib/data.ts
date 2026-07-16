import endfieldRaw from "../../data/endfield-facts.json";
import eventRaw from "../../data/event.json";
import scheduleRaw from "../../data/schedule.seed.json";
import type { EndfieldFact, EventData, OfficialLink, ShowdownStream } from "./types";

const sourceLabels = new Set(["official", "wiki", "stream", "ai_extracted", "editor"]);

function isPublishable(item: { verified: boolean; source: string }) {
  return item.verified === true && item.source !== "ai_extracted" && sourceLabels.has(item.source);
}

function deriveStaticStatus(stream: ShowdownStream): ShowdownStream {
  const liveStatus = Date.parse(stream.scheduledStartTime) > Date.now() ? "upcoming" : "archived";
  return { ...stream, liveStatus };
}

/**
 * 表示ゲート。verified:false / ai_extracted はここで除外し、ページ側から迂回しない。
 */
export function getStreams(): ShowdownStream[] {
  return (scheduleRaw.streams as ShowdownStream[])
    .filter(isPublishable)
    .map(deriveStaticStatus)
    .sort((a, b) => Date.parse(a.scheduledStartTime) - Date.parse(b.scheduledStartTime));
}

export function getEvent(): EventData {
  const event = eventRaw.event as EventData;
  if (!isPublishable(event)) throw new Error("event.json の公開可能な企画データがありません");
  return event;
}

export function getEndfieldFacts(): EndfieldFact[] {
  return (endfieldRaw.facts as EndfieldFact[]).filter(isPublishable);
}

export function getOfficialLinks(): OfficialLink[] {
  return endfieldRaw.officialLinks as OfficialLink[];
}

export function getFact(key: string): EndfieldFact | undefined {
  return getEndfieldFacts().find((fact) => fact.key === key);
}
