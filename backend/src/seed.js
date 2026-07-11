import * as storage from './storage.js';

// Spans domains on purpose so History / Saved demo "not just tech jargon" from minute one.
const SEED_TERMS = [
  {
    term: 'API',
    output: "A defined way for two pieces of software to talk to each other — like a menu of requests one program can make to another.",
    analogy: "Like a restaurant menu: you don't need to know how the kitchen works, just what you can order.",
  },
  {
    term: 'latency',
    output: 'The delay between asking for something and getting a response back.',
  },
  {
    term: 'race condition',
    output: "A bug where the outcome depends on which of two things happens first, and that order isn't guaranteed.",
    analogy: 'Like two people grabbing for the last seat at the same time.',
  },
  {
    term: 'tech debt',
    output: 'Shortcuts taken to ship faster now that will cost extra time to clean up later.',
  },
  {
    term: 'endpoint',
    output: 'One specific address a piece of software can send a request to.',
  },
  {
    term: 'idempotent',
    output: 'An action that gives the same result no matter how many times you repeat it.',
    analogy: "Like pressing an elevator button that's already lit — pressing it again doesn't call two elevators.",
  },
  {
    term: 'indemnify',
    output: "To promise to cover someone's losses or damages if something goes wrong.",
    analogy: "Like promising to pay for any damage if you borrow a friend's car and crash it.",
  },
  {
    term: 'force majeure',
    output: "A contract clause that excuses missed obligations when something outside anyone's control happens, like a natural disaster.",
  },
  {
    term: 'contraindication',
    output: "A specific reason a treatment or medication shouldn't be used for a particular person.",
  },
  {
    term: 'prognosis',
    output: "A doctor's best prediction of how a condition will develop over time.",
  },
  {
    term: 'amortize',
    output: 'To spread the cost of something out in fixed payments over time instead of paying it all at once.',
  },
  {
    term: 'liquidity',
    output: 'How quickly something can be turned into cash without losing value.',
  },
];

export function seedIfEmpty() {
  if (!storage.isEmpty()) return;
  const now = Date.now();
  storage.seedGlossary(
    SEED_TERMS.map((entry, i) => ({ ...entry, ts: now - (SEED_TERMS.length - i) * 1000 })),
  );
}
