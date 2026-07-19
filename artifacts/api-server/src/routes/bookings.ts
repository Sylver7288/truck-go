import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, bookingsTable, customersTable, driversTable, truckTypesTable } from "@workspace/db";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  GetBookingParams,
  CancelBookingParams,
  GetBookingSummaryQueryParams,
  AcceptBookingBody,
  AcceptBookingParams,
  StartBookingParams,
  CompleteBookingParams,
  GetBookingTrackingParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatBooking(b: typeof bookingsTable.$inferSelect, customer?: typeof customersTable.$inferSelect | null, driver?: typeof driversTable.$inferSelect | null, truckType?: typeof truckTypesTable.$inferSelect | null) {
  return {
    id: b.id,
    customerId: b.customerId,
    customerName: customer?.name ?? null,
    driverId: b.driverId ?? null,
    driverName: driver?.name ?? null,
    driverPhone: driver?.phone ?? null,
    truckTypeId: b.truckTypeId,
    truckTypeName: truckType?.name ?? null,
    pickupAddress: b.pickupAddress,
    dropoffAddress: b.dropoffAddress,
    distanceKm: parseFloat(b.distanceKm),
    estimatedPrice: parseFloat(b.estimatedPrice),
    finalPrice: b.finalPrice ? parseFloat(b.finalPrice) : null,
    status: b.status,
    goodsDescription: b.goodsDescription,
    notes: b.notes ?? null,
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    startedAt: b.startedAt?.toISOString() ?? null,
    completedAt: b.completedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

// GET /bookings/summary
router.get("/bookings/summary", async (req, res): Promise<void> => {
  const qp = GetBookingSummaryQueryParams.safeParse({ customerId: parseInt(req.query["customerId"] as string, 10) });
  if (!qp.success) { res.status(400).json({ error: "customerId required" }); return; }

  const allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.customerId, qp.data.customerId));

  const summary = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === "pending").length,
    active: allBookings.filter(b => b.status === "accepted" || b.status === "in_progress").length,
    completed: allBookings.filter(b => b.status === "completed").length,
    cancelled: allBookings.filter(b => b.status === "cancelled").length,
    totalSpent: allBookings.filter(b => b.status === "completed").reduce((sum, b) => sum + parseFloat(b.finalPrice ?? b.estimatedPrice), 0),
  };

  res.json(summary);
});

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const qp = ListBookingsQueryParams.safeParse({
    customerId: parseInt(req.query["customerId"] as string, 10),
    status: req.query["status"],
  });
  if (!qp.success) { res.status(400).json({ error: "customerId required" }); return; }

  const conditions = [eq(bookingsTable.customerId, qp.data.customerId)];
  if (qp.data.status) {
    conditions.push(eq(bookingsTable.status, qp.data.status as any));
  }

  const bookings = await db.select().from(bookingsTable).where(and(...conditions)).orderBy(sql`${bookingsTable.createdAt} DESC`);

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, qp.data.customerId));

  const result = await Promise.all(bookings.map(async (b) => {
    const driver = b.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, b.driverId)))[0] : null;
    const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, b.truckTypeId));
    return formatBooking(b, customer, driver, tt);
  }));

  res.json(result);
});

// POST /bookings
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customerId, truckTypeId, pickupAddress, dropoffAddress, distanceKm, estimatedPrice, goodsDescription, notes, scheduledAt } = parsed.data;

  const [booking] = await db.insert(bookingsTable).values({
    customerId,
    truckTypeId,
    pickupAddress,
    dropoffAddress,
    distanceKm: distanceKm.toString(),
    estimatedPrice: estimatedPrice.toString(),
    goodsDescription,
    notes: notes ?? null,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  }).returning();

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, truckTypeId));

  res.status(201).json(formatBooking(booking, customer, null, tt));
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, booking.customerId));
  const driver = booking.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, booking.driverId)))[0] : null;
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, booking.truckTypeId));

  res.json(formatBooking(booking, customer, driver, tt));
});

// PATCH /bookings/:id/cancel
router.patch("/bookings/:id/cancel", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CancelBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, parsed.data.id))
    .returning();

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, updated.customerId));
  const driver = updated.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId)))[0] : null;
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));

  res.json(formatBooking(updated, customer, driver, tt));
});

// PATCH /bookings/:id/accept
router.patch("/bookings/:id/accept", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const idParsed = AcceptBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!idParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const bodyParsed = AcceptBookingBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ status: "accepted", driverId: bodyParsed.data.driverId })
    .where(eq(bookingsTable.id, idParsed.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  // Mark driver as busy
  await db.update(driversTable).set({ status: "busy" }).where(eq(driversTable.id, bodyParsed.data.driverId));

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, updated.customerId));
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, bodyParsed.data.driverId));
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));

  res.json(formatBooking(updated, customer, driver, tt));
});

// PATCH /bookings/:id/start
router.patch("/bookings/:id/start", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = StartBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ status: "in_progress", startedAt: new Date() })
    .where(eq(bookingsTable.id, parsed.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, updated.customerId));
  const driver = updated.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId)))[0] : null;
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));

  res.json(formatBooking(updated, customer, driver, tt));
});

// PATCH /bookings/:id/complete
router.patch("/bookings/:id/complete", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CompleteBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ status: "completed", completedAt: new Date(), finalPrice: existing.estimatedPrice })
    .where(eq(bookingsTable.id, parsed.data.id))
    .returning();

  // Mark driver available again and increment totalTrips
  if (updated.driverId) {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId));
    if (driver) {
      await db.update(driversTable)
        .set({ status: "available", totalTrips: driver.totalTrips + 1 })
        .where(eq(driversTable.id, updated.driverId));
    }
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, updated.customerId));
  const driver = updated.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId)))[0] : null;
  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));

  res.json(formatBooking(updated, customer, driver, tt));
});

// GET /bookings/:id/tracking
router.get("/bookings/:id/tracking", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBookingTrackingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  const driver = booking.driverId
    ? (await db.select().from(driversTable).where(eq(driversTable.id, booking.driverId)))[0]
    : null;

  res.json({
    bookingId: booking.id,
    status: booking.status,
    driverId: booking.driverId ?? null,
    driverName: driver?.name ?? null,
    driverPhone: driver?.phone ?? null,
    driverLat: driver?.currentLat ?? null,
    driverLng: driver?.currentLng ?? null,
    lastLocationAt: driver?.lastLocationAt?.toISOString() ?? null,
  });
});

export default router;
