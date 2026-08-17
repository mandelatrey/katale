import { badRequest } from "./errors.js";

// Runs a Zod schema and converts failures into a 400 HttpError
// with a compact, JSON-friendly `details` payload.
// Services call this at their boundary so UI, REST, and webhook callers
// all hit the same validation.
export function parse(schema, value, label = "input") {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const details = result.error.issues.map((i) => (
    { path: i.path.join("."),
      message: i.message,
    }
  ));
  throw badRequest(`Invalid ${label}`, details);
}
