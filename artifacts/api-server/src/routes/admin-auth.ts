import { Router, type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";

const COOKIE_NAME = "truckgo_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const isProduction = process.env.NODE_ENV === "production";

const router = Router();

type SessionPayload = {
  email: string;
  exp: number;
};

function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL ?? process.env.VITE_ADMIN_EMAIL;
}

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD ?? process.env.VITE_ADMIN_PASSWORD;
}

function getSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.VITE_ADMIN_PASSWORD;
}

function sign(value: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET must be set");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp <= Date.now()) return null;
    if (payload.email !== getAdminEmail()) return null;
    return payload;
  } catch {
    return null;
  }
}

function clearAdminCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/api/admin",
  });
}

function setAdminCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/api/admin",
    maxAge: SESSION_TTL_MS,
  });
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  const session = verifySessionToken(req.cookies?.[COOKIE_NAME]);
  if (!session) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}

router.post("/admin/auth/login", (req, res): void => {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  const sessionSecret = getSessionSecret();
  const { email, password } = req.body as { email?: string; password?: string };

  if (!adminEmail || !adminPassword || !sessionSecret) {
    res.status(500).json({ error: "Admin authentication is not configured" });
    return;
  }

  if (email !== adminEmail || password !== adminPassword) {
    clearAdminCookie(res);
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  setAdminCookie(res, createSessionToken(adminEmail));
  res.json({ email: adminEmail });
});

router.get("/admin/auth/me", requireAdminSession, (_req, res): void => {
  res.json({ email: getAdminEmail() });
});

router.post("/admin/auth/logout", (_req, res): void => {
  clearAdminCookie(res);
  res.status(204).send();
});

export default router;
