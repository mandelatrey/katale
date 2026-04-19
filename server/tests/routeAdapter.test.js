import { describe, it, expect } from "vitest";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";
import { badRequest, notFound } from "../lib/errors.js";

function mockRes() {
  const res = {
    statusCode: 200,
    headersSent: false,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
  return res;
}

describe("handler()", () => {
  it("returns service output as JSON", async () => {
    const h = handler(async () => ({ hello: "world" }));
    const res = mockRes();
    await h({}, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ hello: "world" });
  });

  it("maps HttpError to status + details", async () => {
    const h = handler(async () => {
      throw badRequest("bad", [{ path: "x", message: "required" }]);
    });
    const res = mockRes();
    await h({}, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("bad");
    expect(res.body.details).toHaveLength(1);
  });

  it("maps CastError to 400", async () => {
    const h = handler(async () => {
      const err = new Error("cast");
      err.name = "CastError";
      throw err;
    });
    const res = mockRes();
    await h({}, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });

  it("404s bubble with correct status", async () => {
    const h = handler(async () => {
      throw notFound("missing thing");
    });
    const res = mockRes();
    await h({}, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("missing thing");
  });
});

describe("actorFromRequest()", () => {
  const fakeReq = (headers) => ({
    header: (name) => headers[name.toLowerCase()] ?? null,
  });

  it("reads x-actor-id header", () => {
    expect(actorFromRequest(fakeReq({ "x-actor-id": "u1" }))).toEqual({
      userId: "u1",
      source: "header",
    });
  });

  it("defaults to anonymous when header missing", () => {
    expect(actorFromRequest(fakeReq({}))).toEqual({
      userId: null,
      source: "anonymous",
    });
  });
});
