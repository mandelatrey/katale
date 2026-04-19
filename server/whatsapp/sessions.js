// Multi-turn session store.
//
// Interface is deliberately small: load, save, clear. An in-memory
// impl is provided so local dev works without hitting Mongo. The
// production impl will be a Mongoose-backed store keyed by phoneE164;
// see TODO below.

/**
 * @typedef {object} Session
 * @property {string} state            A coarse FSM state — e.g. "idle",
 *                                     "awaiting_quantity".
 * @property {Record<string, any>} data Intent-specific partial data the
 *                                     user has already supplied.
 * @property {number} [updatedAt]      Epoch ms.
 */

/**
 * @typedef {object} SessionStore
 * @property {(phoneE164: string) => Promise<Session | null>} load
 * @property {(phoneE164: string, session: Session) => Promise<void>} save
 * @property {(phoneE164: string) => Promise<void>} clear
 */

function createInMemoryStore() {
  const map = new Map();
  return {
    async load(phoneE164) {
      return map.get(phoneE164) ?? null;
    },
    async save(phoneE164, session) {
      map.set(phoneE164, { ...session, updatedAt: Date.now() });
    },
    async clear(phoneE164) {
      map.delete(phoneE164);
    },
  };
}

// TODO(whatsapp): swap this out for a Mongoose-backed store once the
// webhook moves beyond "works on one dev machine". Schema should be
// { phoneE164 (unique), state, data, updatedAt } with a TTL index on
// updatedAt of ~30 min so stale sessions auto-clean.
let store = createInMemoryStore();

export function getSessionStore() {
  return store;
}

export function setSessionStore(custom) {
  store = custom;
}
