// Service result → WhatsApp reply.
//
// Router returns a structured `result`; this file turns it into the
// plain-text body the provider will send. Keeping formatting here (and
// not in the router) means the router stays usable from other surfaces
// — e.g. a future SMS fallback or a CLI simulator.
//
// Today every branch is a stub. The "not_implemented" case is wired
// because the router always returns it while intents are empty.

/**
 * @param {{ kind: string, [key: string]: any }} result
 * @returns {string}
 */
export function formatReply(result) {
  switch (result.kind) {
    case "not_implemented":
      return (
        "Agribridge WhatsApp is in preview — this action isn't wired up " +
        "yet. Reply HELP to see what's available."
      );
    case "help":
      // TODO(whatsapp): list supported commands once intents land.
      return "Help is not available yet.";
    case "error":
      return result.message || "Something went wrong. Please try again.";
    default:
      return "Sorry, I didn't understand that.";
  }
}
