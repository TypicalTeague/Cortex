import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EMPTY_ACTIVITY, loadActivity } from '../core/activity';
import { KEYS, chromeStore, loadProfile, saveProfile } from '../core/storage';
import type { Activity, Profile } from '../core/types';
import '../ui/styles.css';
import { Brand } from '../ui/Logo';
import { Onboarding } from '../ui/Onboarding';
import './popup.css';

const store = chromeStore();

function Popup() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paused, setPaused] = useState(false);
  const [activity, setActivity] = useState<Activity>(EMPTY_ACTIVITY);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile(store).then((p) => {
      setProfile(p);
      setEditing(!p.onboarded);
    });
    store.get<boolean>(KEYS.paused).then((v) => setPaused(!!v));
    loadActivity(store).then(setActivity);
  }, []);

  if (!profile) return null;

  if (editing)
    return (
      <div className="cx popup popup-onb">
        <Onboarding
          initial={profile}
          onDone={async (p) => {
            setProfile(await saveProfile(store, p));
            setEditing(false);
          }}
          onSkip={async () => {
            setProfile(await saveProfile(store, { ...profile, onboarded: true }));
            setEditing(false);
          }}
        />
      </div>
    );

  const togglePause = async () => {
    await store.set(KEYS.paused, !paused);
    setPaused(!paused);
  };

  return (
    <div className="cx popup">
      <div className="popup-head">
        <Brand />
        <label className="switch">
          <input type="checkbox" checked={!paused} onChange={togglePause} aria-label="Cortex active on ChatGPT" />
          <span className="track" />
          <span className="switch-label">{paused ? 'Paused' : 'Active'}</span>
        </label>
      </div>
      <p className="popup-hello">
        {profile.name ? `Hi ${profile.name}. ` : ''}
        {paused ? 'Cortex is paused. ChatGPT works exactly as usual.' : 'Cortex is watching for tasks worth your thinking on ChatGPT.'}
      </p>
      {profile.careerDirection && <p className="cx-faint">Tuned for: {profile.careerDirection}</p>}
      <dl className="popup-stats">
        <div>
          <dt>Thoughts shared</dt>
          <dd>{activity.contributed}</dd>
        </div>
        <div>
          <dt>Stepped in</dt>
          <dd>{activity.interventions}</dd>
        </div>
        <div>
          <dt>Passed through</dt>
          <dd>{activity.passedThrough}</dd>
        </div>
      </dl>
      <div className="popup-actions">
        <button className="cx-btn cx-btn-outline" onClick={() => setEditing(true)}>
          Edit profile
        </button>
        <a className="cx-btn cx-btn-primary" href="https://chatgpt.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          Open ChatGPT
        </a>
      </div>
      <p className="cx-faint popup-foot">Everything stays on this device. Cortex makes no network requests.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
