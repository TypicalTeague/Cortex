// Stage B — one lightweight, contextual prompt (FR-7..FR-10).
// Exactly one question. No word counts, no quizzes, no grading.

import { CAREER_FOCUS, careerTrack, isMinor } from './profile';
import type { Classification, Domain, Intervention, Profile } from './types';

interface Template {
  question: string;
  placeholder: string;
  starters: string[];
  why: string;
}

const BASE: Record<Domain, Template> = {
  coding: {
    question: "What's your first approach?",
    placeholder: 'e.g. I’d split it into… I’m not sure how to…',
    starters: ['I’d start by…', 'The pieces I see are…', 'I’m stuck on…'],
    why: 'Sketching the shape of a solution first keeps the design yours.',
  },
  writing: {
    question: 'What do you want this to say?',
    placeholder: 'Your main point, the angle, a line you already like…',
    starters: ['My main point is…', 'I want the reader to…', 'One example I’d use is…'],
    why: 'Your argument is the part no one else can write for you.',
  },
  career: {
    question: 'What experience do you want this to highlight?',
    placeholder: 'A project, a moment, a reason you want this role…',
    starters: ['The project I’m proudest of is…', 'I want this role because…', 'Something I did that shows it…'],
    why: 'Recruiters read hundreds of generic drafts. Your specifics are the edge.',
  },
  analysis: {
    question: 'What would you investigate first?',
    placeholder: 'A question you’d ask the data, a hunch you’d test…',
    starters: ['My hunch is…', 'I’d first look at…', 'I’d want to know whether…'],
    why: 'A hypothesis before the analysis keeps you in charge of the conclusion.',
  },
  planning: {
    question: 'What do you already have in mind?',
    placeholder: 'Options you’re weighing, what matters most, constraints…',
    starters: ['I’m leaning toward…', 'What matters most is…', 'The constraint is…'],
    why: 'Naming your priorities first makes the advice fit your situation.',
  },
  creative: {
    question: 'What are you hoping to create?',
    placeholder: 'A vibe, a reference, a rough idea — anything goes',
    starters: ['I picture…', 'Something like…, but…', 'I definitely don’t want…'],
    why: 'A rough spark from you makes the result feel like yours.',
  },
  learning: {
    question: 'How would you start on this?',
    placeholder: 'What you already know, where you’d begin, where it gets fuzzy…',
    starters: ['I know that…', 'I’d begin with…', 'It gets confusing when…'],
    why: 'Starting from what you know turns an answer into understanding.',
  },
};

/** Career-track flavouring: question + why, keyed by track and domain. */
const TRACK_OVERRIDES: Record<string, Partial<Record<Domain, Partial<Template>>>> = {
  software: {
    coding: {
      question: 'How would you break this into pieces?',
      why: 'Decomposition and architecture are the core of engineering work — worth practicing on real tasks.',
    },
    career: { question: 'Which project best shows how you build things?' },
  },
  data: {
    analysis: {
      question: 'What’s your hypothesis before looking?',
      why: 'Forming hypotheses and interpreting evidence is the job of an analyst — the tool just runs it.',
    },
    coding: { question: 'What should this code tell you about the data?' },
  },
  business: {
    planning: {
      question: 'What are the options, and what tradeoff matters most?',
      why: 'Weighing tradeoffs is the decision-making muscle every business role relies on.',
    },
    analysis: { question: 'What decision should this analysis inform?' },
  },
  writing: {
    writing: {
      question: 'What’s your argument in one rough sentence?',
      why: 'Original argument and voice are what make a writer worth hiring.',
    },
  },
  design: { creative: { question: 'Who is this for, and what should they feel?' } },
  research: { analysis: { question: 'What question are you really trying to answer?' } },
};

export function buildIntervention(classification: Classification, profile?: Profile): Intervention | null {
  if (classification.kind !== 'meaningful' || !classification.domain) return null;
  const domain = classification.domain;
  const track = profile ? careerTrack(profile) : undefined;
  const override = track ? TRACK_OVERRIDES[track]?.[domain] : undefined;
  const t: Template = { ...BASE[domain], ...override };

  let why = t.why;
  if (track && classification.careerRelevant && !override?.why) {
    const focus = CAREER_FOCUS[track];
    why = `${t.why} It’s also ${focus.focus.slice(0, 2).join(' and ')} practice for ${focus.label}.`;
  }
  if (profile && isMinor(profile)) {
    why = t.why; // keep it general for younger users
  }

  return { domain, question: t.question, why, placeholder: t.placeholder, starters: t.starters };
}

export function greeting(profile?: Profile): string {
  return profile?.name ? `${profile.name}, quick thought first` : 'Quick thought first';
}
