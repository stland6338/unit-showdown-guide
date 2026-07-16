import type { EndfieldFact } from "@/lib/types";

export function SourceBadge({ fact }: { fact: EndfieldFact }) {
  const content = (
    <>
      SOURCE / {fact.source.toUpperCase()}
      {fact.checkedAt ? ` · ${fact.checkedAt}` : ""}
    </>
  );
  return fact.sourceUrl ? (
    <a className="source-badge" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
      {content} ↗
    </a>
  ) : (
    <span className="source-badge">{content}</span>
  );
}

export function FactList({ facts }: { facts: EndfieldFact[] }) {
  return (
    <dl className="fact-list">
      {facts.map((fact) => (
        <div className="fact-row" key={fact.key}>
          <dt>{fact.label}</dt>
          <dd>
            <span>{fact.value}</span>
            {fact.note && <small>{fact.note}</small>}
            <SourceBadge fact={fact} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
