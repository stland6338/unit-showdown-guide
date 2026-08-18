import type { Metadata } from "next";
import { ClosedNotice, closedMetadata } from "@/components/ClosedNotice";
import { FactList, SourceBadge } from "@/components/FactList";
import { SectionHeading } from "@/components/SiteChrome";
import { config } from "@/lib/config";
import { getEndfieldFacts, getOfficialLinks } from "@/lib/data";

export const metadata: Metadata = config.siteClosed
  ? closedMetadata
  : {
      title: "アークナイツ：エンドフィールドとは",
      description: "アークナイツ：エンドフィールドの概要、リリース情報、対応機種、現行バージョンを公式情報に基づいて紹介します。",
    };

export default function EndfieldPage() {
  if (config.siteClosed) return <ClosedNotice />;

  const facts = getEndfieldFacts();
  const links = getOfficialLinks();
  const overview = facts.filter((fact) => ["title", "genre"].includes(fact.key));
  const release = facts.filter((fact) => ["release", "platforms"].includes(fact.key));
  const current = facts.filter((fact) => ["currentVersion", "halfAnniversary"].includes(fact.key));
  const glossary = facts.filter((fact) => fact.key.startsWith("term-"));

  return (
    <>
      <div className="page-hero grid-bg">
        <div className="wrap">
          <span className="kicker">FIELD MANUAL / VERIFIED FACTS ONLY</span>
          <SectionHeading number="PAGE.02" title="What is Endfield?" japanese="はじめて見る人のための概要" as="h1" />
          <p className="page-lead">本ページはファンによる紹介です。最新・正確な情報は必ず公式サイトをご確認ください。</p>
        </div>
      </div>

      <section className="article-section">
        <div className="wrap article-wrap">
          <span className="article-no">01 / OVERVIEW</span>
          <h2>ゲーム概要</h2>
          <FactList facts={overview} />
        </div>
      </section>

      <section className="article-section">
        <div className="wrap article-wrap two-column-article">
          <div>
            <span className="article-no">02 / DEVELOPMENT</span>
            <h2>開発・運営</h2>
            <div className="pending-panel">
              <b>VERIFICATION PENDING</b>
              <p>開発・運営主体の説明は、公式一次情報の確認と掲載承認が完了するまで公開を保留しています。</p>
            </div>
          </div>
          <div>
            <span className="article-no">03 / RELEASE</span>
            <h2>リリースと対応機種</h2>
            <FactList facts={release} />
          </div>
        </div>
      </section>

      <section className="article-section">
        <div className="wrap article-wrap">
          <span className="article-no">04 / CONNECTION</span>
          <h2>『アークナイツ』との関係</h2>
          <div className="pending-panel">
            <b>VERIFICATION PENDING</b>
            <p>両作品の関係性に関する説明は、公式一次情報の確認と掲載承認が完了するまで公開を保留しています。</p>
          </div>
        </div>
      </section>

      <section className="article-section">
        <div className="wrap article-wrap">
          <span className="article-no">05 / GLOSSARY</span>
          <h2>用語ミニ辞典</h2>
          <div className="glossary-grid">
            {glossary.map((fact) => (
              <article className="glossary-card" key={fact.key}>
                <h3>{fact.label}</h3>
                <p>{fact.value}</p>
                <SourceBadge fact={fact} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="article-section">
        <div className="wrap article-wrap two-column-article">
          <div>
            <span className="article-no">06 / CURRENT VERSION</span>
            <h2>現行バージョン「向淵行」</h2>
            <FactList facts={current} />
          </div>
          <div>
            <span className="article-no">07 / OFFICIAL LINKS</span>
            <h2>公式リンク集</h2>
            <div className="official-links">
              {links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label} <span>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
