// CMS Phase 1.1 (password-hashing checks updated in Phase 1.2 for the
// scrypt -> Argon2id switch; role-helper and hidden-input checks added in
// Phase 1.4) — focused, zero-database-access security tests for the new
// admin-identity and CMS-rendering code added in Phase 1. No test framework
// (Jest/Vitest) exists anywhere in this project (confirmed via
// package.json) — introducing one for a handful of checks would be a new
// standing dependency for a codebase that has run entirely on manual/
// scratch verification scripts until now. This follows that same plain
// assert-and-exit-nonzero convention, but — unlike a one-off
// scratch-verify-*.ts — is kept in the repo rather than deleted, since it
// exercises security-sensitive code that is worth being able to re-run
// after any future change to these files.
//
// Deliberately imports NOTHING that touches a database (no lib/db, no
// Prisma Admin/CmsPage/BlogPost model, and lib/admin/auth.ts itself — which
// does import lib/db — is deliberately NOT imported here either) — every
// check here is pure crypto/string/React-rendering/comparison logic, safe
// to run against any environment, local or otherwise.
//
// Run with: npx tsx scripts/verify-cms-phase1-security.ts
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

// A throwaway value for this test run only — never read from .env, never
// written anywhere, never used to sign anything that matters.
process.env.ADMIN_IDENTITY_SESSION_SECRET = "test-only-secret-not-a-real-credential";

import { hashAdminPassword, verifyAdminPassword } from "../lib/admin/password";
import { createAdminIdentityToken, verifyAdminIdentityToken } from "../lib/admin/identity-session";
import { hasAtLeastRole } from "../lib/admin/role";
import { promptHiddenInput, NonInteractiveStdinError } from "../lib/admin/hidden-input";
import { RichTextRenderer } from "../components/cms/RichTextRenderer";
import { slugSchema } from "../lib/cms/slug";
import { validateSectionContent } from "../lib/cms/content-schema";
import { isSafeImageHostUrl } from "../lib/site-images/url-safety";
import { sniffImageMimeType, validateUploadedImage, generateSafeStorageKey, MAX_UPLOAD_BYTES } from "../lib/media/validation";

let failures = 0;
function check(name: string, pass: boolean) {
  if (pass) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

function html(content: unknown): string {
  return renderToStaticMarkup(RichTextRenderer({ content }) as ReactNode);
}

async function run() {
  // ---------------------------------------------------------------------
  // Password hashing (lib/admin/password.ts) — Argon2id via @node-rs/argon2
  // as of CMS Phase 1.2 (replacing Phase 1's original scrypt implementation)
  // ---------------------------------------------------------------------
  const hash = await hashAdminPassword("CorrectHorseBattery1!");
  check(
    "hash is a well-formed $argon2id$ PHC string with the configured parameters",
    /^\$argon2id\$v=19\$m=65536,t=3,p=1\$[^$]+\$[^$]+$/.test(hash),
  );
  check("verify accepts the correct password", await verifyAdminPassword("CorrectHorseBattery1!", hash));
  check("verify rejects a wrong password", !(await verifyAdminPassword("wrong-password", hash)));
  check("verify rejects a null stored hash", !(await verifyAdminPassword("anything", null)));
  check("verify rejects an undefined stored hash", !(await verifyAdminPassword("anything", undefined)));
  check("verify rejects an empty-string stored hash", !(await verifyAdminPassword("anything", "")));
  check(
    "verify rejects a malformed hash that isn't PHC-encoded at all",
    !(await verifyAdminPassword("anything", "not-a-valid-hash")),
  );
  check("verify rejects a truncated hash", !(await verifyAdminPassword("anything", hash.slice(0, 40))));
  check(
    "verify rejects a hash with a tampered final character",
    !(await verifyAdminPassword("CorrectHorseBattery1!", `${hash.slice(0, -1)}${hash.endsWith("A") ? "B" : "A"}`)),
  );

  const hash2 = await hashAdminPassword("CorrectHorseBattery1!");
  check("two hashes of the same password are independently salted (different output strings)", hash !== hash2);
  check("the second, independently-salted hash still verifies on its own", await verifyAdminPassword("CorrectHorseBattery1!", hash2));
  check("the first hash still verifies after hashing again (no shared/overwritten state)", await verifyAdminPassword("CorrectHorseBattery1!", hash));

  // ---------------------------------------------------------------------
  // Session token (lib/admin/identity-session.ts)
  // ---------------------------------------------------------------------
  const adminId = "test-admin-id-123";
  const token = createAdminIdentityToken(adminId);
  check("a freshly issued token verifies back to the same admin id", verifyAdminIdentityToken(token) === adminId);
  check("undefined is rejected", verifyAdminIdentityToken(undefined) === null);
  check("an empty string is rejected", verifyAdminIdentityToken("") === null);
  check("a token with too few parts is rejected", verifyAdminIdentityToken("only.two") === null);
  check("a token with too many parts is rejected", verifyAdminIdentityToken("a.b.c.d") === null);

  const [tAdminId, tExpiry, tSig] = token.split(".");
  check(
    "tampering with the admin id segment is rejected",
    verifyAdminIdentityToken(`${tAdminId}X.${tExpiry}.${tSig}`) === null,
  );
  check(
    "tampering with the expiry segment is rejected",
    verifyAdminIdentityToken(`${tAdminId}.${Number(tExpiry) + 1}.${tSig}`) === null,
  );
  check(
    "tampering with the signature segment is rejected",
    verifyAdminIdentityToken(`${tAdminId}.${tExpiry}.${tSig.slice(0, -2)}00`) === null,
  );

  const pastExpiry = Date.now() - 1000;
  const expiredPayload = `${adminId}.${pastExpiry}`;
  const expiredSig = createHmac("sha256", process.env.ADMIN_IDENTITY_SESSION_SECRET!).update(expiredPayload).digest("hex");
  check(
    "a correctly-signed but expired token is rejected",
    verifyAdminIdentityToken(`${expiredPayload}.${expiredSig}`) === null,
  );

  // ---------------------------------------------------------------------
  // Rich-text renderer allow-list (components/cms/RichTextRenderer.tsx)
  // ---------------------------------------------------------------------
  check("null content renders nothing", html(null) === "");
  check("a non-doc root renders nothing", html({ type: "paragraph" }) === "");

  const safeHtml = html({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }] }] }],
  });
  check("a safe bold paragraph renders <strong>Hello</strong>", safeHtml.includes("<strong") && safeHtml.includes("Hello"));

  const jsLinkHtml = html({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "click me", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
      },
    ],
  });
  check(
    "a javascript: link href is stripped (but its text still renders)",
    !jsLinkHtml.includes("javascript:") && jsLinkHtml.includes("click me"),
  );

  const httpsLinkHtml = html({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "visit", marks: [{ type: "link", attrs: { href: "https://example.com" } }] }] },
    ],
  });
  check('a https: link href is preserved as href="https://example.com"', httpsLinkHtml.includes('href="https://example.com"'));

  const relativeLinkHtml = html({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "home", marks: [{ type: "link", attrs: { href: "/weddings" } }] }] }],
  });
  check('a relative same-origin link href is preserved as href="/weddings"', relativeLinkHtml.includes('href="/weddings"'));

  const emptyDocHtml = html({ type: "doc", content: [] });
  check(
    "a javascript: image src is dropped entirely (identical output to an empty doc)",
    html({ type: "doc", content: [{ type: "image", attrs: { src: "javascript:alert(1)" } }] }) === emptyDocHtml,
  );
  check(
    "a data: image src is dropped (not in the http/https allow-list)",
    html({ type: "doc", content: [{ type: "image", attrs: { src: "data:text/html,<script>alert(1)</script>" } }] }) === emptyDocHtml,
  );

  const unknownNodeHtml = html({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "kept" }] },
      { type: "codeBlock", content: [{ type: "text", text: "dropped" }] },
    ],
  });
  check(
    "an unrecognized node type (codeBlock) is silently dropped, not rendered as-is",
    unknownNodeHtml.includes("kept") && !unknownNodeHtml.includes("dropped"),
  );

  const unknownMarkHtml = html({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "plain", marks: [{ type: "code" }] }] }],
  });
  const plainTextHtml = html({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "plain" }] }] });
  check("an unrecognized mark type (code) is silently dropped", unknownMarkHtml === plainTextHtml);

  const literalHtmlInTextHtml = html({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "<script>alert(1)</script>" }] }],
  });
  check(
    "literal HTML inside a text node is escaped, never injected as a real tag",
    !literalHtmlInTextHtml.includes("<script>") && literalHtmlInTextHtml.includes("&lt;script&gt;"),
  );

  // ---------------------------------------------------------------------
  // Role-rank comparison (lib/admin/role.ts) — CMS Phase 1.4
  // ---------------------------------------------------------------------
  check("ADMIN meets a minimum requirement of ADMIN", hasAtLeastRole("ADMIN", "ADMIN"));
  check("ADMIN meets a minimum requirement of EDITOR (outranks it)", hasAtLeastRole("ADMIN", "EDITOR"));
  check("EDITOR meets a minimum requirement of EDITOR", hasAtLeastRole("EDITOR", "EDITOR"));
  check("EDITOR does NOT meet a minimum requirement of ADMIN", !hasAtLeastRole("EDITOR", "ADMIN"));

  // ---------------------------------------------------------------------
  // Hidden password input fails closed on non-TTY stdin (lib/admin/hidden-input.ts) — CMS Phase 1.4
  // ---------------------------------------------------------------------
  check("this test process's own stdin is not a TTY (the scenario being tested)", !process.stdin.isTTY);
  try {
    await promptHiddenInput("should never be written: ");
    check("promptHiddenInput throws on non-TTY stdin instead of falling back to echoed input", false);
  } catch (err) {
    check("promptHiddenInput throws NonInteractiveStdinError on non-TTY stdin", err instanceof NonInteractiveStdinError);
    check("the thrown error explains why, for whoever reads the bootstrap script's output", err instanceof Error && err.message.includes("TTY"));
  }

  // ---------------------------------------------------------------------
  // Slug validation (lib/cms/slug.ts) — CMS Phase 2
  // ---------------------------------------------------------------------
  check("a normal slug is accepted", slugSchema.safeParse("my-new-page").success);
  check("a reserved slug (an existing static route) is rejected", !slugSchema.safeParse("about").success);
  check("a reserved slug (admin prefix) is rejected", !slugSchema.safeParse("admin").success);
  check("a slug with uppercase letters is rejected", !slugSchema.safeParse("My-Page").success);
  check("a slug with a leading hyphen is rejected", !slugSchema.safeParse("-leading").success);
  check("a slug with a double hyphen is rejected", !slugSchema.safeParse("double--hyphen").success);

  // ---------------------------------------------------------------------
  // CMS section content validation (lib/cms/content-schema.ts) — CMS Phase 2
  // ---------------------------------------------------------------------
  check(
    "a well-formed richtext doc is accepted",
    validateSectionContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }).ok,
  );
  check("a non-doc root is rejected", !validateSectionContent({ type: "paragraph" }).ok);
  check(
    "an unsupported node type inside the doc is rejected",
    !validateSectionContent({ type: "doc", content: [{ type: "codeBlock", content: [] }] }).ok,
  );
  check(
    "an unsupported mark type is rejected",
    !validateSectionContent({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "underline" }] }] }],
    }).ok,
  );
  check("null content is rejected", !validateSectionContent(null).ok);
  check(
    "oversized content is rejected",
    !validateSectionContent({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(200_000) }] }],
    }).ok,
  );

  // ---------------------------------------------------------------------
  // Site image URL safety (lib/site-images/url-safety.ts) — Phase F2 audit.
  // These URLs are fetched server-side by Next's image optimizer, so this
  // is checking SSRF/credential-leak guards, not just "is it a URL."
  // ---------------------------------------------------------------------
  const safe = (u: string) => isSafeImageHostUrl(u).ok;
  check("a normal public https URL is accepted", safe("https://images.example.com/photo.jpg?w=800"));
  check("plain http:// is rejected", !safe("http://images.example.com/photo.jpg"));
  check("javascript: is rejected", !safe("javascript:alert(1)"));
  check("data: is rejected", !safe("data:image/png;base64,aaaa"));
  check("ftp: is rejected", !safe("ftp://example.com/photo.jpg"));
  check("a malformed URL is rejected", !safe("not a url"));
  check("a username/password-bearing URL is rejected", !safe("https://user:pass@example.com/photo.jpg"));
  check(
    "a URL with trusted-looking userinfo but a different real host is rejected",
    !safe("https://trusted-cdn.example.com@evil.example.org/photo.jpg"),
  );
  check("loopback 127.0.0.1 is rejected", !safe("https://127.0.0.1/photo.jpg"));
  check("private 10.x is rejected", !safe("https://10.0.0.5/photo.jpg"));
  check("private 172.16-31.x is rejected", !safe("https://172.20.1.1/photo.jpg"));
  check("a 172.x outside the private range is still rejected (all IPv4 literals blocked)", !safe("https://172.40.1.1/photo.jpg"));
  check("private 192.168.x is rejected", !safe("https://192.168.1.1/photo.jpg"));
  check("link-local / cloud metadata 169.254.169.254 is rejected", !safe("https://169.254.169.254/latest/meta-data/"));
  check("a public-looking dotted-decimal IPv4 literal is still rejected", !safe("https://93.184.216.34/photo.jpg"));
  check("IPv6 loopback [::1] is rejected", !safe("https://[::1]/photo.jpg"));
  check("hostname 'localhost' is rejected", !safe("https://localhost/photo.jpg"));
  check("a .local hostname is rejected", !safe("https://my-nas.local/photo.jpg"));
  check("a .internal hostname is rejected", !safe("https://service.internal/photo.jpg"));
  // The WHATWG URL parser (new URL(), used both here and by Next's image
  // optimizer) canonicalizes every alternate IPv4 encoding to dotted-decimal
  // before .hostname is ever read (confirmed directly against Node's URL
  // parser, not assumed) — these confirm the obfuscated forms don't sneak
  // past the plain dotted-decimal regex check as a result.
  check("shorthand loopback 127.1 is rejected (normalizes to 127.0.0.1)", !safe("https://127.1/photo.jpg"));
  check("hex-encoded loopback 0x7f000001 is rejected", !safe("https://0x7f000001/photo.jpg"));
  check("decimal-encoded loopback 2130706433 is rejected", !safe("https://2130706433/photo.jpg"));
  check("octal-encoded loopback 0177.0.0.1 is rejected", !safe("https://0177.0.0.1/photo.jpg"));
  check("IPv4-mapped IPv6 [::ffff:127.0.0.1] is rejected", !safe("https://[::ffff:127.0.0.1]/photo.jpg"));

  // ---------------------------------------------------------------------
  // Media upload validation (lib/media/validation.ts) — Phase L. Checks
  // the actual file signature (magic bytes), never a claimed Content-Type
  // or filename extension — those are attacker-controlled and the classic
  // file-upload bypass.
  // ---------------------------------------------------------------------
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const GIF_HEADER = Buffer.concat([Buffer.from("GIF89a", "ascii"), Buffer.from([0, 0, 0, 0])]);
  const WEBP_HEADER = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("WEBP", "ascii"),
  ]);
  const FAKE_HTML_CLAIMING_PNG = Buffer.from("<script>alert(1)</script>", "ascii");

  check("a real PNG header is sniffed as image/png", sniffImageMimeType(PNG_HEADER) === "image/png");
  check("a real JPEG header is sniffed as image/jpeg", sniffImageMimeType(JPEG_HEADER) === "image/jpeg");
  check("a real GIF header is sniffed as image/gif", sniffImageMimeType(GIF_HEADER) === "image/gif");
  check("a real WebP header is sniffed as image/webp", sniffImageMimeType(WEBP_HEADER) === "image/webp");
  check(
    "an HTML/script payload is NOT sniffed as any image type (the file-upload bypass this exists to stop)",
    sniffImageMimeType(FAKE_HTML_CLAIMING_PNG) === null,
  );
  check("validateUploadedImage accepts a real PNG", validateUploadedImage(PNG_HEADER).ok);
  check("validateUploadedImage rejects an empty buffer", !validateUploadedImage(Buffer.alloc(0)).ok);
  check(
    "validateUploadedImage rejects a file over the size cap",
    !validateUploadedImage(Buffer.concat([PNG_HEADER, Buffer.alloc(MAX_UPLOAD_BYTES)])).ok,
  );
  check("validateUploadedImage rejects a disguised non-image file", !validateUploadedImage(FAKE_HTML_CLAIMING_PNG).ok);
  check(
    "generateSafeStorageKey never includes a path-traversal sequence",
    !generateSafeStorageKey("image/png").includes(".."),
  );
  check(
    "generateSafeStorageKey derives its extension from the sniffed type, not any filename",
    generateSafeStorageKey("image/png").endsWith(".png") && generateSafeStorageKey("image/webp").endsWith(".webp"),
  );

  // ---------------------------------------------------------------------
  // Authorization sweep (Phase F security review) — a static, file-reading
  // check (no database access, consistent with this script's own
  // convention), two invariants per exported function in the listed
  // files: (1) it calls requireAdminRole/requireAuthenticatedAdmin
  // somewhere in its own body, unconditionally, and (2) when a direct
  // Prisma write is also detected in that body, the auth check precedes
  // it. This exists because exactly this defect class was found live:
  // app/admin/(dashboard)/enquiries/communication-actions.ts's
  // addCommunicationNote had no authorization check at all before this
  // review added one. A heuristic (brace-depth body extraction, not a real
  // parser) but effective enough to have caught the actual bug.
  // ---------------------------------------------------------------------
  const ACTION_FILES_REQUIRING_AUTH = [
    "app/admin/(dashboard)/bookings/actions.ts",
    "app/admin/(dashboard)/clients/actions.ts",
    "app/admin/(dashboard)/consultations/actions.ts",
    "app/admin/(dashboard)/enquiries/actions.ts",
    "app/admin/(dashboard)/enquiries/communication-actions.ts",
    "app/admin/(dashboard)/invoices/actions.ts",
    "app/admin/(dashboard)/payments/actions.ts",
    "app/admin/(dashboard)/planning-requests/actions.ts",
    "app/admin/(dashboard)/quotes/actions.ts",
    "app/admin/(dashboard)/tasks/actions.ts",
    "app/admin/(dashboard)/vendors/actions.ts",
    "lib/cms/actions.ts",
    "lib/media/actions.ts",
    "lib/site-images/actions.ts",
    "lib/site-copy/actions.ts",
    "lib/settings/actions.ts",
  ];
  const WRITE_CALL = /prisma\.\w+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)\(/;
  const AUTH_CALL = /requireAdminRole|requireAuthenticatedAdmin/;

  for (const relPath of ACTION_FILES_REQUIRING_AUTH) {
    const src = readFileSync(relPath, "utf8");
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^export async function (\w+)\s*\(/);
      if (!m) continue;
      const fnName = m[1];
      let depth = 0;
      let started = false;
      let body = "";
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === "{") { depth++; started = true; }
          if (ch === "}") depth--;
        }
        body += lines[j] + "\n";
        if (started && depth === 0) break;
      }
      // Primary, unconditional invariant: every exported function in one of
      // these admin-only action files must itself call requireAdminRole/
      // requireAuthenticatedAdmin somewhere in its own body — checked
      // regardless of whether a direct Prisma write is detected in that
      // same body. This closes a real blind spot found while writing this
      // sweep: lib/media/actions.ts's uploadMediaAsset delegates its actual
      // prisma.mediaAsset.create to lib/media/service.ts's
      // performMediaUpload (a plain helper, not independently gated,
      // trusted only because every caller already checks first) — so a
      // write-must-precede-auth check scoped to this function's own body
      // alone would find no write to compare against and silently skip it,
      // even though the function still needs (and has) its own auth call.
      const authIdx = body.search(AUTH_CALL);
      check(`${relPath} :: ${fnName} calls an authorization check`, authIdx !== -1);

      // Secondary, additional invariant: when a direct Prisma write IS
      // detected in this same function body, the auth check must precede
      // it — the original ordering check, still valuable for the common
      // case (most functions still do their own read/write directly).
      const writeMatch = body.match(WRITE_CALL);
      if (writeMatch) {
        const writeIdx = body.indexOf(writeMatch[0]);
        check(
          `${relPath} :: ${fnName} checks authorization before its own database write`,
          authIdx !== -1 && authIdx < writeIdx,
        );
      }
    }
  }

  // ---------------------------------------------------------------------
  // Role-denial redirect loop (Phase G) — a static, file-reading check. A
  // role-denied admin in requireAdminRole() gets redirect()-ed somewhere;
  // if that target's own page.tsx requires a higher role than EVERY admin
  // has, the denied admin is redirected right back into another denial —
  // an infinite loop. This is exactly what happened when the target was
  // /admin/enquiries, whose page.tsx requires requireAdminRole("ADMIN"), so
  // a denied EDITOR looped forever. Asserts the configured target's own
  // page requires only "EDITOR" (the lowest rank), reachable by every role.
  // ---------------------------------------------------------------------
  {
    const authSrc = readFileSync("lib/admin/auth.ts", "utf8");
    // lib/admin/auth.ts has two redirect() calls (requireAuthenticatedAdmin's
    // ->/admin/login, and requireAdminRole's own denial target) — scope the
    // match to requireAdminRole's own body specifically, not the whole file,
    // or this would silently check the wrong redirect.
    const fnStart = authSrc.indexOf("export async function requireAdminRole");
    const fnBody = fnStart === -1 ? "" : authSrc.slice(fnStart);
    const redirectMatch = fnBody.match(/redirect\(\s*"([^"]+)"\s*\)/);
    check("lib/admin/auth.ts :: requireAdminRole has a redirect target configured", !!redirectMatch);

    if (redirectMatch) {
      const target = redirectMatch[1];
      // Only admin dashboard routes are in scope for this invariant — a
      // target outside app/admin/(dashboard) isn't gated by requireAdminRole
      // at all, so the loop risk this check guards against doesn't apply.
      const relative = target.replace(/^\/admin\//, "");
      const targetPagePath = `app/admin/(dashboard)/${relative}/page.tsx`;
      let targetSrc: string | null = null;
      try {
        targetSrc = readFileSync(targetPagePath, "utf8");
      } catch {
        targetSrc = null;
      }
      check(`${targetPagePath} :: role-denial redirect target page exists`, targetSrc !== null);
      if (targetSrc !== null) {
        check(
          `${targetPagePath} :: role-denial redirect target does not itself require ADMIN (no redirect loop)`,
          !/requireAdminRole\(\s*"ADMIN"\s*\)/.test(targetSrc),
        );
      }
    }
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

run();
