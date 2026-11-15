import { useState } from 'react';
import { AGE_RANGES, AI_USES, CAREER_DIRECTIONS, DEFAULT_PROFILE, SKILLS, STAGES, isMinor } from '../core/profile';
import type { Profile } from '../core/types';
import { Brand } from './Logo';

interface Props {
  initial?: Profile;
  onDone: (p: Profile) => void;
  onSkip: () => void;
}

function Chips<T extends string>({
  options,
  value,
  onChange,
  multi,
  label,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  multi?: boolean;
  label: string;
}) {
  return (
    <div className="cx-chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className="cx-chip"
            aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : on ? [] : [o.value])}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const asOpts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));
const STEPS = 5;

export function Onboarding({ initial, onDone, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ ...DEFAULT_PROFILE, ...initial });
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const minor = isMinor(p);

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : onDone({ ...p, onboarded: true }));
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="cx-onb" data-testid="onboarding">
      {step > 0 && (
        <div className="cx-progress" aria-label={`Step ${step} of ${STEPS - 1}`}>
          <div style={{ width: `${(step / (STEPS - 1)) * 100}%` }} />
        </div>
      )}

      <div className="cx-onb-step" key={step}>
        {step === 0 && (
          <>
            <div style={{ marginBottom: 28 }}>
              <Brand size={28} />
            </div>
            <h1>Use AI without handing over your thinking.</h1>
            <p className="lead">Cortex sits next to ChatGPT. Quick questions go straight through. When a task is worth your thinking, it asks for your take first, then organizes it into a starting point the AI builds on.</p>
            <ul className="cx-points">
              <li>
                <span className="n">1</span>
                <span>
                  <b>Stays out of the way</b> for lookups, conversions and quick facts.
                </span>
              </li>
              <li>
                <span className="n">2</span>
                <span>
                  <b>Asks one question</b> when your thinking matters. You can always skip.
                </span>
              </li>
              <li>
                <span className="n">3</span>
                <span>
                  <b>Turns your rough idea into structure</b>, and the AI builds on it.
                </span>
              </li>
            </ul>
            <p className="cx-faint">About a minute to set up. Everything stays on this device.</p>
          </>
        )}

        {step === 1 && (
          <>
            <h2>First, a bit about you</h2>
            <p className="lead">So Cortex can talk to you like a person. All optional.</p>
            <div className="cx-field">
              <span className="cx-label" id="age-l">
                Age range
              </span>
              <Chips label="Age range" options={AGE_RANGES} value={p.ageRange ? [p.ageRange] : []} onChange={(v) => set({ ageRange: v[0] })} />
            </div>
            {!minor && (
              <div className="cx-field">
                <label className="cx-label" htmlFor="cx-name">
                  What should Cortex call you?
                </label>
                <input id="cx-name" className="cx-input" placeholder="First name or nickname" value={p.name ?? ''} onChange={(e) => set({ name: e.target.value || undefined })} />
              </div>
            )}
            {minor && <p className="cx-faint">For users under 18, Cortex skips the name and free-text questions and keeps things minimal.</p>}
          </>
        )}

        {step === 2 && (
          <>
            <h2>Where are you right now?</h2>
            <p className="lead">This shapes the kind of tasks Cortex expects.</p>
            <div className="cx-field">
              <span className="cx-label">Stage</span>
              <Chips label="Stage" options={STAGES} value={p.stage ? [p.stage] : []} onChange={(v) => set({ stage: v[0] })} />
            </div>
            <div className="cx-field">
              <label className="cx-label" htmlFor="cx-field">
                Field of study or work
              </label>
              <input id="cx-field" className="cx-input" placeholder="e.g. Computer Science, Economics, Nursing" value={p.field ?? ''} onChange={(e) => set({ field: e.target.value || undefined })} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Where are you headed?</h2>
            <p className="lead">Cortex connects its questions to the skills your career will need.</p>
            <div className="cx-field">
              <span className="cx-label">Career direction</span>
              <Chips label="Career direction" options={asOpts(CAREER_DIRECTIONS)} value={p.careerDirection ? [p.careerDirection] : []} onChange={(v) => set({ careerDirection: v[0] })} />
            </div>
            {!minor && (
              <div className="cx-field">
                <label className="cx-label" htmlFor="cx-amb">
                  Any specific ambition? <span className="cx-faint">(optional)</span>
                </label>
                <input id="cx-amb" className="cx-input" placeholder="e.g. Land a SWE internship next summer" value={p.ambitions ?? ''} onChange={(e) => set({ ambitions: e.target.value || undefined })} />
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h2>How do you use AI?</h2>
            <p className="lead">Pick any that apply, then the skills you'd like to keep sharp.</p>
            <div className="cx-field">
              <span className="cx-label">I use AI for</span>
              <Chips label="AI uses" multi options={asOpts(AI_USES)} value={p.aiUses} onChange={(v) => set({ aiUses: v })} />
            </div>
            <div className="cx-field">
              <span className="cx-label">Skills I want to strengthen</span>
              <Chips label="Skills" multi options={asOpts(SKILLS)} value={p.skills} onChange={(v) => set({ skills: v })} />
            </div>
          </>
        )}
      </div>

      <div className="cx-onb-nav">
        {step === 0 ? (
          <button className="cx-btn cx-btn-ghost" onClick={onSkip} data-testid="onb-skip">
            Skip setup
          </button>
        ) : (
          <button className="cx-btn cx-btn-ghost" onClick={back}>
            Back
          </button>
        )}
        <button className="cx-btn cx-btn-primary" onClick={next} data-testid="onb-next">
          {step === 0 ? 'Get started' : step === STEPS - 1 ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
