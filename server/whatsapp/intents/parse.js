// Intent parser — currently a stub.
//
// The simplest workable design for the first iteration is keyword +
// numbered-menu matching against the current session state. An LLM-based
// parser slots into the same function signature later without changing
// the router.

/**
 * @param {string} text
 * @param {{ state: string, data: any } | null} _session
 * @returns {{ kind: string, args?: Record<string, unknown> }}
 */
export function parseIntent(_text, _session) {
  return { kind: "unknown" };
}
