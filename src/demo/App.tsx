import { useEffect, useRef, useState } from 'react';
import { EMPTY_ACTIVITY, loadActivity, recordActivity } from '../core/activity';
import { classify } from '../core/classifier';
import { DEFAULT_PROFILE } from '../core/profile';
import { KEYS, loadProfile, localStorageStore, saveProfile } from '../core/storage';
import type { Activity, Classification, Profile } from '../core/types';
import { CortexCard } from '../ui/CortexCard';
import { Brand } from '../ui/Logo';
import { Onboarding } from '../ui/Onboarding';
import { continuationReply, routineReply, skippedReply } from './replies';

const store = localStorageStore();

type Msg =
  | { id: number; kind: 'user'; text: string; enriched?: string }
  | { id: number; kind: 'assistant'; text: string; scripted: boolean; chatgptPrompt?: string }
  | { id: number; kind: 'note'; text: string; tone: 'pass' | 'cortex' }
  | { id: number; kind: 'card'; request: string; classification: Classification };

const SUGGESTIONS = [
  'What is the capital of Belgium?',
  'Convert 15 miles into kilometers.',
  'Help me create a portfolio website',
  'Write my internship cover letter',
  'Help me analyze this dataset',
];

let nextId = 1;
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [last, setLast] = useState<{ text: string; c: Classification } | null>(null);
  const [activity, setActivity] = useState<Activity>(EMPTY_ACTIVITY);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadProfile(store).then((p) => {
      setProfile(p);
      setOnboarding(!p.onboarded);
    });
    loadActivity(store).then(setActivity);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  const pendingCard = msgs.some((m) => m.kind === 'card');
  const push = (...m: NewMsg[]) => setMsgs((xs) => [...xs, ...m.map((x) => ({ ...x, id: nextId++ }) as Msg)]);
  const track = (e: keyof Activity) => recordActivity(store, e).then(setActivity);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || pendingCard || !profile) return;
    setInput('');
    const c = classify(text, profile);
    setLast({ text, c });
    if (c.kind === 'routine') {
      const r = routineReply(text);
      push({ kind: 'user', text }, { kind: 'note', tone: 'pass', text: 'Routine request: Cortex let it straight through.' }, { kind: 'assistant', text: r.text, scripted: r.scripted });
      track('passedThrough');
    } else {
      push({ kind: 'card', request: text, classification: c });
      track('interventions');
    }
  };

  const resolveCard = (id: number, after: NewMsg[]) => {
    setMsgs((xs) => [...xs.filter((m) => m.id !== id), ...after.map((x) => ({ ...x, id: nextId++ }) as Msg)]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishOnboarding = async (p: Profile) => {
    setProfile(await saveProfile(store, p));
    setOnboarding(false);
  };

  const reset = () => {
    try {
      localStorage.removeItem(KEYS.profile);
      localStorage.removeItem(KEYS.activity);
    } catch {
      /* ignore */
    }
    setProfile({ ...DEFAULT_PROFILE });
    setActivity(EMPTY_ACTIVITY);
    setMsgs([]);
    setLast(null);
    setOnboarding(true);
  };

  if (!profile) return null;

  if (onboarding) {
    return (
      <div className="cx demo-onb">
        <Onboarding initial={profile} onDone={finishOnboarding} onSkip={() => finishOnboarding({ ...profile, onboarded: true })} />
      </div>
    );
  }

  const who = [profile.name, profile.careerDirection].filter(Boolean).join(' · ') || 'Default profile';

  return (
    <div className="cx demo">
      <header className="demo-top">
        <div className="demo-top-left">
          <Brand />
          <span className="demo-pill">Interactive demo</span>
        </div>
        <div className="demo-top-right">
          <button className="cx-btn cx-btn-outline demo-profile" onClick={() => setOnboarding(true)} data-testid="profile-chip" title="Edit profile">
            {who}
          </button>
          <button className="cx-btn cx-btn-ghost" onClick={reset} data-testid="reset">
            Reset
          </button>
        </div>
      </header>

      <div className="demo-body">
        <main className="demo-chat" aria-label="Demo AI chat">
          <div className="demo-thread">
            {msgs.length === 0 && (
              <div className="demo-empty">
                <h1>{profile.name ? `Hi ${profile.name}. ` : ''}Ask anything, the way you'd ask ChatGPT.</h1>
                <p className="cx-muted">Cortex watches what kind of task it is. Try a quick question first, then a real task.</p>
              </div>
            )}
            {msgs.map((m) => {
              if (m.kind === 'user')
                return (
                  <div key={m.id} className="msg msg-user" data-testid="msg-user">
                    {m.enriched ? (
                      <div>
                        <div className="msg-user-head">Your request and your thinking</div>
                        <pre className="msg-enriched" data-testid="enriched">
                          {m.enriched}
                        </pre>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                );
              if (m.kind === 'note')
                return (
                  <div key={m.id} className={`msg-note ${m.tone}`} data-testid={`note-${m.tone}`}>
                    <span className="msg-note-dot" /> {m.text}
                  </div>
                );
              if (m.kind === 'assistant')
                return (
                  <div key={m.id} className="msg msg-ai" data-testid="msg-ai">
                    <div className="msg-ai-label">{m.scripted ? 'Demo assistant · scripted reply' : 'Demo assistant · computed locally'}</div>
                    <div className="msg-ai-text">{m.text}</div>
                    {m.chatgptPrompt && (
                      <a className="msg-link" href={`https://chatgpt.com/?q=${encodeURIComponent(m.chatgptPrompt)}`} target="_blank" rel="noreferrer">
                        Send this to ChatGPT for real ↗
                      </a>
                    )}
                  </div>
                );
              return (
                <div key={m.id} className="msg-card">
                  <CortexCard
                    request={m.request}
                    classification={m.classification}
                    profile={profile}
                    onSkip={() => {
                      track('skipped');
                      resolveCard(m.id, [
                        { kind: 'note', tone: 'cortex', text: 'You skipped Cortex. The original request was sent unchanged.' },
                        { kind: 'user', text: m.request },
                        { kind: 'assistant', text: skippedReply(), scripted: true, chatgptPrompt: m.request },
                      ]);
                    }}
                    onStructured={() => track('contributed')}
                    onContinue={(prompt, s) =>
                      resolveCard(m.id, [
                        { kind: 'note', tone: 'cortex', text: 'Your thinking was structured and attached to the request.' },
                        { kind: 'user', text: m.request, enriched: prompt },
                        { kind: 'assistant', text: continuationReply(s), scripted: true, chatgptPrompt: prompt },
                      ])
                    }
                  />
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="demo-composer-wrap">
            <div className="cx-chips demo-suggest" aria-label="Try these">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="cx-chip" onClick={() => send(s)} disabled={pendingCard}>
                  {s}
                </button>
              ))}
            </div>
            <form
              className="demo-composer"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                className="demo-input"
                aria-label="Message"
                data-testid="composer"
                placeholder={pendingCard ? 'Share a quick thought with Cortex above, or skip' : 'Message the demo assistant…'}
                value={input}
                disabled={pendingCard}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <button className="cx-btn cx-btn-primary" type="submit" disabled={!input.trim() || pendingCard} data-testid="send" aria-label="Send">
                ↑
              </button>
            </form>
          </div>
        </main>

        <aside className="demo-side" aria-label="Under the hood">
          <h2>Under the hood</h2>
          {!last ? (
            <p className="cx-faint">Send a message to see how Cortex classifies it.</p>
          ) : (
            <div className="side-block" data-testid="last-classification">
              <div className="side-row">
                <span className={`side-kind ${last.c.kind}`}>{last.c.kind === 'routine' ? 'Routine' : 'Meaningful'}</span>
                {last.c.domain && <span className="cx-tag">{last.c.domain}</span>}
                <span className="cx-faint" style={{ marginLeft: 'auto' }}>
                  confidence {Math.round(last.c.confidence * 100)}%
                </span>
              </div>
              <p className="side-q">“{last.text}”</p>
              <ul className="side-reasons">
                {last.c.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <h3>This session on this device</h3>
          <dl className="side-stats">
            <div>
              <dt>Passed through</dt>
              <dd data-testid="stat-passed">{activity.passedThrough}</dd>
            </div>
            <div>
              <dt>Cortex stepped in</dt>
              <dd>{activity.interventions}</dd>
            </div>
            <div>
              <dt>Thoughts shared</dt>
              <dd data-testid="stat-contributed">{activity.contributed}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd>{activity.skipped}</dd>
            </div>
          </dl>

          <h3>What's real here</h3>
          <ul className="side-honest">
            <li>Classification, the question and the structuring all run live in your browser. The logic is deterministic and makes no AI calls.</li>
            <li>Assistant replies are scripted, except unit conversions, which are calculated. The Chrome extension sends the same prompts to ChatGPT.</li>
            <li>Your profile and counts are saved in this browser only.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
