import crypto from "crypto";
import { prisma } from "./prisma";

const SECRET = process.env.ENCRYPTION_KEY || "matrix-secure-auth-secret-key-32chars!";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export interface AuthSessionPayload {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  name: string;
  exp: number;
}

export function signSessionToken(payload: Omit<AuthSessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const data: AuthSessionPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedData)
    .digest("base64url");
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token: string): AuthSessionPayload | null {
  try {
    const [encodedData, signature] = token.split(".");
    if (!encodedData || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(encodedData)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const json = Buffer.from(encodedData, "base64url").toString("utf8");
    const payload: AuthSessionPayload = JSON.parse(json);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(
  req: Request
): Promise<AuthSessionPayload | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/matrix_auth_session=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  return verifySessionToken(token);
}

/**
 * Ensures initial default accounts exist for immediate login
 */
export async function ensureDefaultAccounts(): Promise<void> {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: "admin@ozima.ai",
          name: "System Administrator",
          password: hashPassword("admin123"),
          role: "ADMIN",
        },
      });
    }

    const userExists = await prisma.user.findFirst({
      where: { role: "USER" },
    });

    if (!userExists) {
      await prisma.user.create({
        data: {
          email: "user@ozima.ai",
          name: "Playground Explorer",
          password: hashPassword("user123"),
          role: "USER",
        },
      });
    }
  } catch (err) {
    console.warn("Failed to check or seed default accounts:", err);
  }
}
