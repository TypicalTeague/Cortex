import { useEffect, useMemo, useRef, useState } from 'react';
import { buildIntervention, greeting } from '../core/interventions';
import { buildEnrichedPrompt, hasUserContent, structureThought } from '../core/transform';
import type { Classification, Profile, StructuredThought } from '../core/types';
import { Logo } from './Logo';
import { StructuredView } from './StructuredView';

export interface CortexCardProps {
  request: string;
  classification: Classification;
  profile?: Profile;
  /** Send the original request unchanged (FR-9). */
  onSkip: () => void;
  /** Send the enriched prompt (FR-14). */
  onContinue: (enrichedPrompt: string, structured: StructuredThought, thought: string) => void;
  /** Called when the user contributed a thought (for local activity counts). */
  onStructured?: (structured: StructuredThought) => void;
  /** Close without sending anything (extension only). */
  onCancel?: () => void;
  continueLabel?: string;
  skipLabel?: string;
}

const DOMAIN_NAME: Record<string, string> = {
  coding: 'Coding',
  writing: 'Writing',
  career: 'Career',
  analysis: 'Analysis',
  planning: 'Planning',
  creative: 'Creative',
  learning: 'Learning',
};

export function CortexCard(props: CortexCardProps) {
  const { request, classification, profile } = props;
  const intervention = useMemo(() => buildIntervention(classification, profile), [classification, profile]);
  const [thought, setThought] = useState('');
  const [structured, setStructured] = useState<StructuredThought | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!structured) textRef.current?.focus();
  }, [structured]);

  if (!intervention) return null;

  const submitThought = () => {
    if (!thought.trim()) return;
    const s = structureThought(request, thought, classification);
    setStructured(s);
    props.onStructured?.(s);
  };

  const addStarter = (starter: string) => {
    const base = starter.replace(/…$/, ' ');
    setThought((t) => (t.trim() ? `${t.trimEnd()} ${base}` : base));
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  return (
    <div className="cx-card" role="dialog" aria-label="Cortex" data-testid="cortex-card">
      <div className="cx-card-head">
        <span className="cx-brand">
          <Logo size={20} /> <span>Cortex</span>
          <span className="cx-tag" style={{ marginLeft: 4 }}>
            {DOMAIN_NAME[intervention.domain]}
          </span>
        </span>
        {props.onCancel && (
          <button className="cx-icon-btn" onClick={props.onCancel} aria-label="Close Cortex without sending">
            ✕
          </button>
        )}
      </div>

      {!structured ? (
        <div>
          <div className="cx-request" title={request}>
            <b>You asked:</b> {request}
          </div>
          <p className="cx-hello">{greeting(profile)}</p>
          <h3 className="cx-question" id="cx-q">
            {intervention.question}
          </h3>
          <p className="cx-why">{intervention.why}</p>
          <textarea
            ref={textRef}
            className="cx-textarea"
            aria-labelledby="cx-q"
            data-testid="thought-input"
            placeholder={intervention.placeholder}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submitThought();
              }
            }}
          />
          <div className="cx-chips cx-starters" aria-label="Sentence starters">
            {intervention.starters.map((s) => (
              <button key={s} type="button" className="cx-chip" onClick={() => addStarter(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="cx-actions">
            <button className="cx-btn cx-btn-ghost" onClick={props.onSkip} data-testid="skip">
              {props.skipLabel ?? 'Skip — just answer it'}
            </button>
            <div className="cx-actions-right">
              <button className="cx-btn cx-btn-primary" onClick={submitThought} disabled={!thought.trim()} data-testid="structure">
                Shape my thinking <span className="cx-kbd">⌘↵</span>
              </button>
            </div>
          </div>
          <details className="cx-details">
            <summary>Why did Cortex step in?</summary>
            <ul>
              {classification.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <div>
          <StructuredView s={structured} domain={classification.domain} />
          {!hasUserContent(structured) && (
            <p className="cx-faint" style={{ marginTop: 10 }}>
              That was brief — totally fine. The AI will still see it as your starting point.
            </p>
          )}
          <div className="cx-actions">
            <button className="cx-btn cx-btn-ghost" onClick={() => setStructured(null)} data-testid="edit">
              Edit my thoughts
            </button>
            <div className="cx-actions-right">
              <button
                className="cx-btn cx-btn-primary"
                data-testid="continue"
                onClick={() => props.onContinue(buildEnrichedPrompt(request, thought, structured), structured, thought)}
              >
                {props.continueLabel ?? 'Continue with AI'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
