// Shared error helpers used by services and route adapters.
// Services throw HttpError; the route wrapper turns it into a JSON response.

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    if (details) this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const notFound = (msg) => new HttpError(404, msg || "Not found");
export const forbidden = (msg) => new HttpError(403, msg || "Forbidden");
