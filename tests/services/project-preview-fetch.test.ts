import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:http", () => ({ request: mocks.request }));
vi.mock("node:https", () => ({ request: mocks.request }));
import { readPublicHtml } from "@/lib/members/safe-fetch";

function respond(
  status = 200,
  headers: Record<string, string> = { "content-type": "text/html" },
  body = "<title>Preview</title>",
) {
  mocks.request.mockImplementationOnce((_url, _options, callback) => {
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode: number;
        headers: Record<string, string>;
        destroy: () => void;
      };
      response.statusCode = status;
      response.headers = headers;
      response.destroy = vi.fn();
      callback(response);
      response.emit("data", Buffer.from(body));
      response.emit("end");
    };
    return request;
  });
}

describe("website preview transport", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
  });
  it("pins the validated DNS result to the connection, without sending credentials", async () => {
    respond();
    expect(await readPublicHtml("https://example.org/project")).toEqual({
      html: "<title>Preview</title>",
      url: "https://example.org/project",
    });
    const options = mocks.request.mock.calls[0][1];
    const callback = vi.fn();
    options.lookup("example.org", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "8.8.8.8", 4);
    expect(options.agent).toBe(false);
    expect(options.headers.cookie).toBeUndefined();
    expect(options.headers.authorization).toBeUndefined();
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
  });
  it("rejects mixed public/private DNS responses before requesting anything", async () => {
    mocks.lookup.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ]);
    await expect(readPublicHtml("https://example.org")).rejects.toThrow("public");
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("validates redirect targets again and never follows an internal redirect", async () => {
    respond(302, { location: "http://169.254.169.254/secret" });
    await expect(readPublicHtml("https://example.org")).rejects.toThrow("public");
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("bounds redirects while permitting a public redirect", async () => {
    respond(301, { location: "/next" });
    respond();
    expect((await readPublicHtml("https://example.org")).url).toBe("https://example.org/next");
    for (let i = 0; i < 4; i++) respond(302, { location: "/loop" });
    await expect(readPublicHtml("https://example.org/loop")).rejects.toThrow("redirects");
    expect(mocks.request).toHaveBeenCalledTimes(6);
  });
  it("rejects non-HTML and oversized responses, including chunked bodies", async () => {
    respond(200, { "content-type": "application/json" });
    await expect(readPublicHtml("https://example.org")).rejects.toThrow();
    respond(200, { "content-type": "text/html", "content-length": "600000" });
    await expect(readPublicHtml("https://example.org")).rejects.toThrow();
    respond(200, { "content-type": "text/html" }, "x".repeat(600000));
    await expect(readPublicHtml("https://example.org")).rejects.toThrow("large");
  });
});
