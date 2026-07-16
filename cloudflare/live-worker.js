/**
 * UNIT SHOWDOWN ライブ検知 Worker
 *
 * ../アルプススタンド2026/cloudflare/live-worker.js の実績コードを基に、
 * ライブ検知・48時間以内の終了直後アーカイブ・GET /api/live だけへ簡約したもの。
 * APIキーは Worker secret YOUTUBE_API_KEY のみに置く。
 */

// data/schedule.seed.json と同期して管理する（channelId → streamId / liverName）。
const CHANNELS = [
  { channelId: "UCam_xf14FPFsRshFTj4wkHw", streamId: "practice-shirasuna-ayane", liverName: "白砂あやね" },
  { channelId: "UCkhViRjLUKgIcVpar9JiNrw", streamId: "practice-tamanoi-nana", liverName: "珠乃井ナナ" },
  { channelId: "UCUP8TmlO7NNra88AMqGU_vQ", streamId: "practice-koshimizu-toru", liverName: "小清水透" },
  { channelId: "UCGLS7BOgNa6c03r7VYacblw", streamId: "practice-minamo-madoka", liverName: "水面まどか" },
  { channelId: "UC7_MFM9b8hp5kuTSpa8WyOQ", streamId: "practice-shioriha-ruri", liverName: "栞葉るり" },
  { channelId: "UCWRPqA0ehhWV4Hnp27PJCkQ", streamId: "practice-shishido-akari", liverName: "獅子堂あかり" },
  { channelId: "UCtLfA_qUqCJtjXJM2ZR_keg", streamId: "practice-ishigami-nozomi", liverName: "石神のぞみ" },
  { channelId: "UCyJOgJhgfoVRpFjsBCUmuvg", streamId: "practice-kozue-mone", liverName: "梢桃音" },
  { channelId: "UCu-rV2gPtJ-CsGxe71z_BrQ", streamId: "practice-igarashi-rika", liverName: "五十嵐梨花" },
  { channelId: "UCivwPlOp0ojnMPZj5pNOPPA", streamId: "practice-sophia-valentine", liverName: "ソフィア・ヴァレンタイン" },
  { channelId: "UClrQ7xhRBxS_v_-WuudGKmA", streamId: "practice-kaburaki-roco", liverName: "鏑木ろこ" },
  { channelId: "UCiJ_Um3KbfF19NzkDYLzZVQ", streamId: "practice-kisara", liverName: "綺沙良" },
  { channelId: "UCiA-trSZfB0i92V_-dyDqBw", streamId: "practice-kuramochi-meruto", liverName: "倉持めると" },
  { channelId: "UCzsCWYuvPUky3-DKzphYbEw", streamId: "practice-shiga-riko", liverName: "司賀りこ" },
  { channelId: "UCX7YkU9nEeaoZbkVLVajcMg", streamId: "main-showdown", liverName: "にじさんじ公式" },
];

import { handleOg } from "./og.js";

const KEYWORDS = ["エンドフィールド", "endfield", "ユニショーダウン", "unit showdown", "アークナイツ"];
const ARCHIVE_WINDOW_MS = 48 * 60 * 60 * 1_000;

function emptyPayload() {
  return { generatedAt: null, streams: [], recentArchives: [] };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control": "public, max-age=60",
    },
  });
}

function byStart(a, b) {
  return (a.actualStartTime ?? a.scheduledStartTime ?? "9999").localeCompare(
    b.actualStartTime ?? b.scheduledStartTime ?? "9999"
  );
}

async function refresh(env) {
  const key = env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY 未設定");

  // 1) 参加14ch + 公式chのアップロードプレイリスト直近5件を取得する。
  const videoIds = [];
  const owner = new Map();
  for (const channel of CHANNELS) {
    const playlistId = `UU${channel.channelId.slice(2)}`;
    const url =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      `?part=contentDetails&maxResults=5&playlistId=${playlistId}&key=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const json = await response.json();
      for (const item of json.items ?? []) {
        const videoId = item.contentDetails?.videoId;
        if (!videoId || owner.has(videoId)) continue;
        videoIds.push(videoId);
        owner.set(videoId, channel);
      }
    } catch {
      // 1chの失敗で全体を止めない。
    }
  }

  // 2) videos.list（50件/リクエスト）で状態と開始・終了時刻を取得する。
  const streams = [];
  const archivesFound = [];
  for (let index = 0; index < videoIds.length; index += 50) {
    const ids = videoIds.slice(index, index + 50).join(",");
    if (!ids) continue;
    const url =
      "https://www.googleapis.com/youtube/v3/videos" +
      `?part=snippet,liveStreamingDetails&id=${ids}&key=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const json = await response.json();
      for (const video of json.items ?? []) {
        const channel = owner.get(video.id);
        if (!channel) continue;
        const haystack = `${video.snippet?.title ?? ""}\n${video.snippet?.description ?? ""}`.toLowerCase();
        const related = KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
        if (!related) continue;

        const status = video.snippet?.liveBroadcastContent;
        if (status === "live" || status === "upcoming") {
          streams.push({
            videoId: video.id,
            channelId: channel.channelId,
            streamId: channel.streamId,
            liverName: channel.liverName,
            title: video.snippet.title,
            liveStatus: status,
            scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime ?? null,
            actualStartTime: video.liveStreamingDetails?.actualStartTime ?? null,
          });
          continue;
        }

        const actualEndTime = video.liveStreamingDetails?.actualEndTime;
        if (status === "none" && actualEndTime && Date.now() - Date.parse(actualEndTime) < ARCHIVE_WINDOW_MS) {
          archivesFound.push({
            videoId: video.id,
            channelId: channel.channelId,
            streamId: channel.streamId,
            liverName: channel.liverName,
            title: video.snippet.title,
            publishedAt: video.snippet.publishedAt,
            actualStartTime: video.liveStreamingDetails?.actualStartTime ?? null,
            actualEndTime,
          });
        }
      }
    } catch {
      // バッチの失敗時も、取得済みチャンネル分を保存する。
    }
  }

  streams.sort(byStart);

  // 3) 前回の終了直後アーカイブとマージし、48時間で自然失効させる。
  const previous = (await env.LIVE_KV.get("live", "json")) ?? emptyPayload();
  const now = Date.now();
  const archives = new Map(
    (previous.recentArchives ?? [])
      .filter((archive) => archive.actualEndTime && now - Date.parse(archive.actualEndTime) < ARCHIVE_WINDOW_MS)
      .map((archive) => [archive.videoId, archive])
  );
  for (const archive of archivesFound) archives.set(archive.videoId, archive);
  const recentArchives = [...archives.values()].sort((a, b) => b.actualEndTime.localeCompare(a.actualEndTime));

  const payload = { generatedAt: new Date().toISOString(), streams, recentArchives };
  await env.LIVE_KV.put("live", JSON.stringify(payload));
  return payload;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      refresh(env).catch((error) => {
        console.error("live refresh failed", error instanceof Error ? error.message : String(error));
      })
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/og") {
      try {
        return await handleOg(request, env, ctx);
      } catch (error) {
        console.error("og render failed", error instanceof Error ? error.message : String(error));
        return new Response("og unavailable", { status: 500 });
      }
    }
    if (request.method === "OPTIONS" && url.pathname === "/api/live") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/api/live") {
      const cached = await env.LIVE_KV.get("live", "json");
      if (cached) return jsonResponse(cached);
      try {
        return jsonResponse(await refresh(env));
      } catch {
        return jsonResponse(emptyPayload());
      }
    }
    return new Response("unit-showdown-guide live worker", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
