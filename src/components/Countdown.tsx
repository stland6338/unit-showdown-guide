"use client";

import { useEffect, useState } from "react";

const DEFAULT_TARGET = "2026-08-18T21:00:00+09:00";

function remaining(target: number) {
  let delta = Math.max(0, target - Date.now());
  const days = Math.floor(delta / 86_400_000);
  delta -= days * 86_400_000;
  const hours = Math.floor(delta / 3_600_000);
  delta -= hours * 3_600_000;
  const minutes = Math.floor(delta / 60_000);
  delta -= minutes * 60_000;
  const seconds = Math.floor(delta / 1_000);
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

interface CountdownProps {
  /** 本戦開始日時（+09:00 ISO8601）。data/event.json の mainMatch.datetime を渡す */
  target?: string;
  /** 延期発表済みで振替日程が未発表のときは数字を止めて POSTPONED 表示 */
  postponed?: boolean;
}

export function Countdown({ target = DEFAULT_TARGET, postponed = false }: CountdownProps) {
  const targetMs = Date.parse(target);
  const [digits, setDigits] = useState(["--", "--", "--", "--"]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (postponed || Number.isNaN(targetMs)) return;
    const tick = () => {
      setDigits(remaining(targetMs));
      setStarted(Date.now() >= targetMs);
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [postponed, targetMs]);

  if (postponed) {
    return (
      <div className="countdown corner countdown--postponed" aria-live="off">
        <span className="c3" aria-hidden />
        <div className="label">MAIN MATCH — 本戦</div>
        <div className="postponed-word">POSTPONED</div>
        <div className="postponed-ja">延期 — 延期日等の詳細は後日発表</div>
      </div>
    );
  }

  const units = ["DAYS", "HRS", "MIN", "SEC"];
  return (
    <div className={`countdown corner${started ? " countdown--started" : ""}`} aria-live="off">
      <span className="c3" aria-hidden />
      <div className="label">{started ? "MAIN MATCH — 本戦開始時刻を過ぎました" : "MAIN MATCH IN — 本戦まで"}</div>
      <div className="digits">
        {digits.map((digit, index) => (
          <span className="digit-pair" key={units[index]}>
            <span className="num">{digit}</span>
            <span className="unit">{units[index]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
