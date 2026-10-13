import bcrypt from "bcryptjs";

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;

  public static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, PasswordUtil.SALT_ROUNDS);
  }

  public static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
