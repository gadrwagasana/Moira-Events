// Validates image URLs accepted into SiteImageSlot/PortfolioItem. Unlike
// components/cms/RichTextRenderer.tsx's isSafeUrl (which only needs to keep
// an unsafe *protocol* like javascript: out of a plain <img>/<a> rendered
// client-side), these URLs are passed to Next's `next/image` optimizer,
// which performs a SERVER-SIDE fetch of whatever URL is configured
// (next.config.mjs allow-lists https:// broadly, by hostname "**", so the
// protocol check alone isn't enough here) — so this additionally guards
// against the image optimizer being used as an SSRF/internal-network probe
// or a vector for leaking credentials embedded in the URL itself into
// public page HTML.
//
// Known, accepted limitation: hostname-based checks cannot stop DNS
// rebinding (a hostname that resolves to a public address now could be
// repointed at a private address later, after this check has already
// passed) — closing that fully would require the image optimizer itself to
// pin and re-validate the resolved IP per-fetch, which next/image does not
// expose a hook for. This blocks the straightforward cases: literal
// loopback/private/link-local addresses and reserved local hostnames.

const IPV4_LITERAL = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const RESERVED_HOSTNAME_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home.arpa"];
const RESERVED_HOSTNAMES = new Set(["localhost"]);

function isPrivateOrReservedIPv4(hostname: string): boolean {
  if (!IPV4_LITERAL.test(hostname)) return false;
  const octets = hostname.split(".").map(Number);
  if (octets.some((n) => n > 255)) return false; // malformed, not a routable literal either way
  const [a, b] = octets;
  return (
    a === 127 || // loopback
    a === 10 || // private
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 169 && b === 254) || // link-local (includes cloud metadata, 169.254.169.254)
    a === 0 // "this network"
  );
}

export function isSafeImageHostUrl(raw: string): { ok: true } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "Enter a valid URL." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Image URL must start with https://" };
  }

  // A URL like https://trusted-looking-name@evil.com/x.jpg parses with host
  // "evil.com" — the userinfo before '@' is not part of the actual
  // destination, so rejecting it outright prevents both the
  // request-ends-up-somewhere-other-than-it-looks-like confusion and any
  // credential value from being stored and re-embedded in public page HTML.
  if (url.username || url.password) {
    return { ok: false, reason: "Image URL must not include a username or password." };
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname.includes(":")) {
    // IPv6 literal — WHATWG URL parsing keeps the brackets on .hostname
    // (e.g. "[::1]", confirmed by direct test against Node's URL parser,
    // not assumed), and every real IPv6 literal/IPv4-mapped form contains a
    // colon either way, so this blanket check needs no bracket handling of
    // its own. Every IPv6 literal is rejected outright rather than
    // distinguishing loopback/private ranges from public ones, since
    // legitimate image hosts are referenced by name, never by a raw address.
    return { ok: false, reason: "Image URL must use a hostname, not a raw IP address." };
  }
  if (isPrivateOrReservedIPv4(hostname) || hostname === "0.0.0.0") {
    return { ok: false, reason: "Image URL must not point at a private or internal address." };
  }
  if (IPV4_LITERAL.test(hostname)) {
    // A public-looking dotted-decimal IP literal — still rejected: a real
    // photo host is referenced by name, and allowing IP literals at all
    // makes the private-range check above easier to get wrong/bypass later.
    return { ok: false, reason: "Image URL must use a hostname, not a raw IP address." };
  }
  if (RESERVED_HOSTNAMES.has(hostname) || RESERVED_HOSTNAME_SUFFIXES.some((suf) => hostname.endsWith(suf))) {
    return { ok: false, reason: "Image URL must not point at a local or internal hostname." };
  }

  return { ok: true };
}
