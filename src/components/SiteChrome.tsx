import Link from "next/link";
import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { getEvent } from "@/lib/data";

export function SiteHeader() {
  return (
    <>
      <div className="unofficial" role="note">
        UNOFFICIAL FAN GUIDE — 当サイトは非公式のファンサイトです。ANYCOLOR社・GRYPHLINE社とは一切関係ありません
      </div>
      <header className="site-header">
        <div className="wrap site-inner">
          <Link className="logo" href="/" aria-label="UNIT SHOWDOWN 非公式観戦ガイド トップ">
            UNIT SHOWDOWN
            <small>UNOFFICIAL FAN GUIDE</small>
          </Link>
          <nav className="gnav" aria-label="メインナビゲーション">
            <Link href="/schedule/">SCHEDULE</Link>
            <Link href="/#main">MAIN MATCH</Link>
            <Link href="/endfield/">ENDFIELD?</Link>
          </nav>
        </div>
      </header>
      <Hazard />
    </>
  );
}

export function SiteFooter() {
  const event = getEvent();
  return (
    <>
      <Hazard />
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <span className="stamp">UNOFFICIAL / FAN-MADE</span>
            <p className="disclaimer">
              当サイトはファンが運営する非公式の観戦ガイドです。ANYCOLOR株式会社、GRYPHLINE、Hypergryphとは一切関係ありません。
              「にじさんじ」は ANYCOLOR株式会社の、『アークナイツ：エンドフィールド』は GRYPHLINE の商標または登録商標です。
            </p>
            <p className="disclaimer">
              掲載内容の誤り・権利に関するご連絡は
              <a href={config.contactUrl} target="_blank" rel="noopener noreferrer">
                お問い合わせ窓口
              </a>
              からお知らせください。権利者からの要請があった場合は、確認のうえ速やかに修正・取り下げを行います。
            </p>
          </div>
          <div className="footer-sources" aria-label="企画情報の出典">
            <span className="micro-label">OFFICIAL SOURCES</span>
            {event.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label} ↗
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

export function Hazard({ thin = false }: { thin?: boolean }) {
  return <div className={thin ? "hazard hazard--thin" : "hazard"} aria-hidden />;
}

export function SectionHeading({
  number,
  title,
  japanese,
  as = "h2",
}: {
  number: string;
  title: string;
  japanese: string;
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div className="sec-head">
      <span className="sec-no">{number}</span>
      <Heading className="sec-title">{title}</Heading>
      <span className="sec-title-ja">{japanese}</span>
    </div>
  );
}

export function CornerPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`corner ${className}`}>
      <span className="c3" aria-hidden />
      {children}
    </div>
  );
}
