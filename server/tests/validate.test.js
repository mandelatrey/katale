import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parse } from "../lib/validate.js";
import { HttpError, badRequest, notFound, forbidden } from "../lib/errors.js";

describe("validate.parse", () => {
  const schema = z.object({ n: z.coerce.number().positive() });

  it("returns coerced data on success", () => {
    expect(parse(schema, { n: "42" }, "x")).toEqual({ n: 42 });
  });

  it("throws a 400 HttpError with compact details on failure", () => {
    try {
      parse(schema, { n: -1 }, "widget");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect(err.status).toBe(400);
      expect(err.message).toMatch(/Invalid widget/);
      expect(err.details[0].path).toBe("n");
    }
  });
});

describe("error helpers", () => {
  it("badRequest/notFound/forbidden carry the right status", () => {
    expect(badRequest("x").status).toBe(400);
    expect(notFound().status).toBe(404);
    expect(forbidden().status).toBe(403);
  });
});
