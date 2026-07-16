"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (element?: HTMLElement) => void } };
  }
}

const SCRIPT_ID = "twitter-wjs";

/**
 * X公式埋め込みウィジェット。widgets.js 読み込み前・失敗時は
 * blockquote 内のリンクがそのままフォールバック表示になる。
 */
export function TweetEmbed({ url, label }: { url: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => window.twttr?.widgets.load(ref.current ?? undefined);
    if (window.twttr) {
      load();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", load);
    if (!existing) {
      script.id = SCRIPT_ID;
      (script as HTMLScriptElement).src = "https://platform.twitter.com/widgets.js";
      (script as HTMLScriptElement).async = true;
      document.body.appendChild(script);
    }
    return () => script.removeEventListener("load", load);
  }, []);

  return (
    <div className="x-embed" ref={ref}>
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true" data-lang="ja">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {label} — 公式ポストをXで見る →
        </a>
      </blockquote>
    </div>
  );
}
