import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable, driversTable } from "@workspace/db";
import {
  RegisterCustomerBody,
  RegisterDriverBody,
  LoginBody,
} from "@workspace/api-zod";
import { sendVerificationEmail } from "../lib/email";
import crypto from "node:crypto";

const router: IRouter = Router();
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
}

function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? process.env.PUBLIC_APP_URL ?? "http://localhost:5000").replace(/\/+$/, "");
}

function getVerifyUrl(token: string): string {
  return `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendUserVerificationEmail(input: { email: string; name: string; token: string }) {
  await sendVerificationEmail({
    to: input.email,
    name: input.name,
    verifyUrl: getVerifyUrl(input.token),
  });
}

// POST /auth/register/customer
router.post("/auth/register/customer", async (req, res): Promise<void> => {
  const parsed = RegisterCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await db.select().from(customersTable).where(eq(customersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const verification = createVerificationToken();

  const [customer] = await db.insert(customersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpiresAt: verification.expiresAt,
  }).returning();

  await sendUserVerificationEmail({ email: customer.email, name: customer.name, token: verification.token });

  req.log.info({ customerId: customer.id }, "Customer registered");
  res.status(201).json({ userId: customer.id, role: "customer", name: customer.name, email: customer.email, emailVerified: false });
});

// POST /auth/register/driver
router.post("/auth/register/driver", async (req, res): Promise<void> => {
  const parsed = RegisterDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, phone, password, licenseNumber, truckTypeId, vehiclePlate, vehicleYear } = parsed.data;

  const existing = await db.select().from(driversTable).where(eq(driversTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const verification = createVerificationToken();

  const [driver] = await db.insert(driversTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpiresAt: verification.expiresAt,
    licenseNumber,
    vehiclePlate,
    vehicleYear: vehicleYear ?? null,
    truckTypeId,
  }).returning();

  await sendUserVerificationEmail({ email: driver.email, name: driver.name, token: verification.token });

  req.log.info({ driverId: driver.id }, "Driver registered");
  res.status(201).json({ userId: driver.id, role: "driver", name: driver.name, email: driver.email, emailVerified: false });
});

// GET /auth/verify-email?token=...
router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const tokenHash = hashToken(token);

  if (!token) {
    res.status(400).json({ error: "Verification token is required" });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.emailVerificationTokenHash, tokenHash));
  if (customer) {
    if (!customer.emailVerificationExpiresAt || customer.emailVerificationExpiresAt < new Date()) {
      res.status(400).json({ error: "Verification link has expired" });
      return;
    }

    await db.update(customersTable).set({
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    }).where(eq(customersTable.id, customer.id));
    res.json({ role: "customer", email: customer.email, verified: true });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.emailVerificationTokenHash, tokenHash));
  if (driver) {
    if (!driver.emailVerificationExpiresAt || driver.emailVerificationExpiresAt < new Date()) {
      res.status(400).json({ error: "Verification link has expired" });
      return;
    }

    await db.update(driversTable).set({
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    }).where(eq(driversTable.id, driver.id));
    res.json({ role: "driver", email: driver.email, verified: true });
    return;
  }

  res.status(400).json({ error: "Verification link is invalid" });
});

// POST /auth/resend-verification
router.post("/auth/resend-verification", async (req, res): Promise<void> => {
  const { email, role } = req.body as { email?: string; role?: "customer" | "driver" };
  if (!email || (role !== "customer" && role !== "driver")) {
    res.status(400).json({ error: "Email and role are required" });
    return;
  }

  const verification = createVerificationToken();

  if (role === "customer") {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
    if (!customer) { res.status(404).json({ error: "Account not found" }); return; }
    if (customer.emailVerifiedAt) { res.json({ message: "Email is already verified" }); return; }

    await db.update(customersTable).set({
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
    }).where(eq(customersTable.id, customer.id));
    await sendUserVerificationEmail({ email: customer.email, name: customer.name, token: verification.token });
  } else {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.email, email));
    if (!driver) { res.status(404).json({ error: "Account not found" }); return; }
    if (driver.emailVerifiedAt) { res.json({ message: "Email is already verified" }); return; }

    await db.update(driversTable).set({
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
    }).where(eq(driversTable.id, driver.id));
    await sendUserVerificationEmail({ email: driver.email, name: driver.name, token: verification.token });
  }

  res.json({ message: "Verification email sent" });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, role } = parsed.data;
  const hashed = hashPassword(password);

  if (role === "customer") {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
    if (!customer || customer.passwordHash !== hashed) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (!customer.emailVerifiedAt) {
      res.status(403).json({ error: "Please verify your email before logging in." });
      return;
    }
    res.json({ userId: customer.id, role: "customer", name: customer.name, email: customer.email });
  } else {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.email, email));
    if (!driver || driver.passwordHash !== hashed) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (!driver.emailVerifiedAt) {
      res.status(403).json({ error: "Please verify your email before logging in." });
      return;
    }
    res.json({ userId: driver.id, role: "driver", name: driver.name, email: driver.email });
  }
});

// GET /auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = parseInt(req.query["userId"] as string, 10);
  const role = req.query["role"] as string;

  if (!userId || !role) {
    res.status(400).json({ error: "userId and role required" });
    return;
  }

  if (role === "customer") {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, userId));
    if (!customer) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, role: "customer", createdAt: customer.createdAt });
  } else {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, userId));
    if (!driver) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: driver.id, name: driver.name, email: driver.email, phone: driver.phone, role: "driver", createdAt: driver.createdAt });
  }
});

export default router;
