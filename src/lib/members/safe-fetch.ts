import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

const MAX_BYTES = 512 * 1024;

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    // Includes mapped IPv4: no loopback, private, link-local, CGNAT, multicast,
    // documentation, unspecified or reserved addresses.
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

export function publicTarget(input: string): URL {
  const url = new URL(input);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.includes("%") ||
    (isIP(host) && !isPublicAddress(host))
  )
    throw new Error("Not a public website");
  return url;
}

type PageResponse = { status: number; location?: string; html: string };

async function readPage(url: URL, signal: AbortSignal): Promise<PageResponse> {
  signal.throwIfAborted();
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let abortLookup: () => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    abortLookup = () => reject(signal.reason);
    signal.addEventListener("abort", abortLookup, { once: true });
  });
  const addresses = await Promise.race([lookup(hostname, { all: true }), aborted]).finally(() =>
    signal.removeEventListener("abort", abortLookup),
  );
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address)))
    throw new Error("Not a public website");
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        signal,
        agent: false,
        family: pinned.family,
        // The validated address is used for the connection. Host/SNI still use
        // the original hostname, preventing a second DNS lookup/rebinding.
        lookup: (_host, _options, callback) => callback(null, pinned.address, pinned.family),
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
          "user-agent": "PioneerWiki-LinkPreview/1.0",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          resolve({ status, location: response.headers.location, html: "" });
          response.destroy();
          return;
        }
        if (
          status !== 200 ||
          !/^(text\/html|application\/xhtml\+xml)\b/i.test(response.headers["content-type"] ?? "") ||
          Number(response.headers["content-length"] ?? 0) > MAX_BYTES ||
          response.headers["content-encoding"]
        ) {
          reject(new Error("Website has no readable sharing information"));
          response.destroy();
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            reject(new Error("Website preview is too large"));
            response.destroy();
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve({ status, html: Buffer.concat(chunks).toString("utf8") }));
        response.on("error", reject);
        response.on("aborted", () => reject(new Error("Website preview was interrupted")));
      },
    );
    request.on("error", reject);
    request.end();
  });
}

/** No cookies, credentials, scripts, arbitrary ports, private networks or unbounded redirects. */
export async function readPublicHtml(input: string): Promise<{ html: string; url: string }> {
  const signal = AbortSignal.timeout(6000);
  let url = publicTarget(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await readPage(url, signal);
    if (!response.location) return { html: response.html, url: url.href };
    url = publicTarget(new URL(response.location, url).href);
  }
  throw new Error("Too many website redirects");
}
