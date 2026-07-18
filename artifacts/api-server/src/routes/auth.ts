import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable, driversTable } from "@workspace/db";
import {
  RegisterCustomerBody,
  RegisterDriverBody,
  LoginBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import crypto from "node:crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
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

  const [customer] = await db.insert(customersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
  }).returning();

  req.log.info({ customerId: customer.id }, "Customer registered");
  res.status(201).json({ userId: customer.id, role: "customer", name: customer.name, email: customer.email });
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

  const [driver] = await db.insert(driversTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    licenseNumber,
    vehiclePlate,
    vehicleYear: vehicleYear ?? null,
    truckTypeId,
  }).returning();

  req.log.info({ driverId: driver.id }, "Driver registered");
  res.status(201).json({ userId: driver.id, role: "driver", name: driver.name, email: driver.email });
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
    res.json({ userId: customer.id, role: "customer", name: customer.name, email: customer.email });
  } else {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.email, email));
    if (!driver || driver.passwordHash !== hashed) {
      res.status(401).json({ error: "Invalid email or password" });
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
