import type { Domain, StructuredThought, ThoughtItem } from '../core/types';

const IDEAS_LABEL: Record<Domain, string> = {
  coding: 'Your proposed structure',
  writing: 'Your points',
  career: 'What you want to highlight',
  analysis: 'Your ideas to test',
  planning: 'What you have in mind',
  creative: 'Your idea',
  learning: 'What you already know',
};

function Items({ items, decision, offset = 0 }: { items: ThoughtItem[]; decision?: boolean; offset?: number }) {
  return (
    <ul>
      {items.map((it, i) => (
        <li key={it.text} className={`cx-item${decision ? ' decision' : ''}`} data-source={it.source} style={{ animationDelay: `${(offset + i) * 60}ms` }}>
          {it.text}
        </li>
      ))}
    </ul>
  );
}

export function StructuredView({ s, domain }: { s: StructuredThought; domain?: Domain }) {
  const sections: [string, ThoughtItem[], boolean?][] = [
    [IDEAS_LABEL[domain ?? 'planning'], s.ideas],
    ['Your approach', s.approach],
    ['Constraints you named', s.constraints],
    ['Decisions still to make', s.openDecisions, true],
  ];
  let offset = 0;
  return (
    <div data-testid="structured">
      <p className="cx-structured-title">Your idea, structured</p>
      <p className="cx-structured-goal" data-testid="goal">
        {s.goal.text}
      </p>
      <div className="cx-sections">
        {sections
          .filter(([, items]) => items.length > 0)
          .map(([label, items, decision]) => {
            const el = (
              <section className="cx-section" key={label}>
                <h4>{label}</h4>
                <Items items={items} decision={decision} offset={offset} />
              </section>
            );
            offset += items.length;
            return el;
          })}
      </div>
      {s.suggestions.length > 0 && (
        <aside className="cx-suggest" data-testid="suggestions" aria-label="Cortex suggestions">
          <h4>
            <span aria-hidden="true">✦</span> Cortex suggests
          </h4>
          <ul>
            {s.suggestions.map((x) => (
              <li key={x.text} data-source="cortex">
                {x.text}
              </li>
            ))}
          </ul>
        </aside>
      )}
      <div className="cx-legend">
        <span>
          <i className="cx-dot" style={{ background: 'var(--cx-you)' }} /> Your words, organized
        </span>
        <span>
          <i className="cx-dot" style={{ background: 'var(--cx-accent)' }} /> Added by Cortex
        </span>
      </div>
    </div>
  );
}
