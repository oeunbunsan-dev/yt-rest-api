import { describe, expect, it } from "bun:test";
import { PasswordUtil } from "../../src/common/utils/password.util";

describe("PasswordUtil Unit Tests", () => {
  it("should securely hash a password and verify it matches", async () => {
    const raw = "SecurePassword2026!";
    const hashed = await PasswordUtil.hash(raw);

    expect(hashed).toBeDefined();
    expect(hashed).not.toEqual(raw);
    expect(hashed.startsWith("$2")).toBeTrue();

    const isMatch = await PasswordUtil.compare(raw, hashed);
    expect(isMatch).toBeTrue();
  });

  it("should reject an incorrect password comparison", async () => {
    const raw = "SecurePassword2026!";
    const wrong = "WrongPassword!";
    const hashed = await PasswordUtil.hash(raw);

    const isMatch = await PasswordUtil.compare(wrong, hashed);
    expect(isMatch).toBeFalse();
  });
});
