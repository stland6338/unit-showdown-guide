"use client";

import { useEffect, useState } from "react";

const TARGET = Date.parse("2026-07-28T21:00:00+09:00");

function remaining() {
  let delta = Math.max(0, TARGET - Date.now());
  const days = Math.floor(delta / 86_400_000);
  delta -= days * 86_400_000;
  const hours = Math.floor(delta / 3_600_000);
  delta -= hours * 3_600_000;
  const minutes = Math.floor(delta / 60_000);
  delta -= minutes * 60_000;
  const seconds = Math.floor(delta / 1_000);
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

export function Countdown() {
  const [digits, setDigits] = useState(["--", "--", "--", "--"]);

  useEffect(() => {
    const tick = () => setDigits(remaining());
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const units = ["DAYS", "HRS", "MIN", "SEC"];
  return (
    <div className="countdown corner" aria-live="off">
      <span className="c3" aria-hidden />
      <div className="label">MAIN MATCH IN — 本戦まで</div>
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
