import { describe, expect, it } from "vitest";
import {
  normalizeAccount,
  canSeeAccount,
  canEditAccount,
  resolvePurposeAndVisibility,
  defaultVisibilityForPurpose,
} from "@/convex/lib/accountAccess";
import type { Doc, Id } from "@/convex/_generated/dataModel";

const owner = "owner" as unknown as Id<"users">;
const other = "other" as unknown as Id<"users">;

function accountDoc(p: Partial<Doc<"accounts">>): Doc<"accounts"> {
  return {
    _id: "acc" as unknown as Id<"accounts">,
    _creationTime: 0,
    householdId: "hh" as unknown as Id<"households">,
    name: "Account",
    type: "checking",
    balance: 0,
    color: "#000000",
    ...p,
  } as Doc<"accounts">;
}

describe("normalizeAccount", () => {
  it("defaults legacy rows to joint + shared", () => {
    const n = normalizeAccount(accountDoc({}), owner);
    expect(n.ownerId).toBe(owner);
    expect(n.purpose).toBe("joint");
    expect(n.visibility).toBe("shared");
  });

  it("derives private visibility for personal accounts missing visibility", () => {
    const n = normalizeAccount(accountDoc({ ownerId: other, purpose: "personal" }), owner);
    expect(n.ownerId).toBe(other);
    expect(n.visibility).toBe("private");
  });

  it("preserves explicit fields", () => {
    const n = normalizeAccount(
      accountDoc({ ownerId: other, purpose: "personal", visibility: "shared" }),
      owner,
    );
    expect(n.visibility).toBe("shared");
  });
});

describe("canSeeAccount", () => {
  it("shared accounts are visible to anyone", () => {
    expect(canSeeAccount(other, { ownerId: owner, visibility: "shared" })).toBe(true);
  });
  it("private accounts are visible only to the owner", () => {
    expect(canSeeAccount(owner, { ownerId: owner, visibility: "private" })).toBe(true);
    expect(canSeeAccount(other, { ownerId: owner, visibility: "private" })).toBe(false);
  });
});

describe("canEditAccount", () => {
  it("shared accounts are editable by anyone", () => {
    expect(canEditAccount(other, { ownerId: owner, visibility: "shared" })).toBe(true);
  });
  it("private accounts are editable only by the owner", () => {
    expect(canEditAccount(owner, { ownerId: owner, visibility: "private" })).toBe(true);
    expect(canEditAccount(other, { ownerId: owner, visibility: "private" })).toBe(false);
  });
});

describe("resolvePurposeAndVisibility", () => {
  it("forces shared visibility for joint and business", () => {
    expect(resolvePurposeAndVisibility({ purpose: "joint", visibility: "private" })).toEqual({
      purpose: "joint",
      visibility: "shared",
    });
    expect(resolvePurposeAndVisibility({ purpose: "business" }).visibility).toBe("shared");
  });
  it("defaults personal accounts to private but respects explicit shared", () => {
    expect(resolvePurposeAndVisibility({ purpose: "personal" }).visibility).toBe("private");
    expect(resolvePurposeAndVisibility({ purpose: "personal", visibility: "shared" }).visibility).toBe("shared");
  });
});

describe("defaultVisibilityForPurpose", () => {
  it("personal is private, others shared", () => {
    expect(defaultVisibilityForPurpose("personal")).toBe("private");
    expect(defaultVisibilityForPurpose("joint")).toBe("shared");
    expect(defaultVisibilityForPurpose("business")).toBe("shared");
  });
});
