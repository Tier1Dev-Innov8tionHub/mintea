import { afterEach, describe, expect, it } from "vitest";
import { isEmailAllowed } from "@/convex/lib/allowlist";

const KEY = "AUTH_ALLOWED_EMAILS";

afterEach(() => {
  delete process.env[KEY];
});

describe("isEmailAllowed", () => {
  it("allows everyone when the allowlist is unset (fails open)", () => {
    delete process.env[KEY];
    expect(isEmailAllowed("anyone@example.com")).toBe(true);
    expect(isEmailAllowed(undefined)).toBe(true);
  });

  it("allows everyone when the allowlist is blank/whitespace", () => {
    process.env[KEY] = "   ";
    expect(isEmailAllowed("anyone@example.com")).toBe(true);
  });

  it("matches allowlisted emails case-insensitively", () => {
    process.env[KEY] = "you@example.com, Partner@Example.com";
    expect(isEmailAllowed("YOU@example.com")).toBe(true);
    expect(isEmailAllowed("partner@example.com")).toBe(true);
  });

  it("rejects non-allowlisted or missing emails when configured", () => {
    process.env[KEY] = "you@example.com";
    expect(isEmailAllowed("stranger@example.com")).toBe(false);
    expect(isEmailAllowed(undefined)).toBe(false);
    expect(isEmailAllowed(null)).toBe(false);
  });
});
