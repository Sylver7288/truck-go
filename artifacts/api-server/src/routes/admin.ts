import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, bookingsTable, customersTable, driversTable, truckTypesTable } from "@workspace/db";

const router: IRouter = Router();

const bookingStatuses = new Set(["pending", "accepted", "in_progress", "completed", "cancelled"]);
const driverStatuses = new Set(["available", "busy", "offline"]);

function formatAdminBooking(r: {
  booking: typeof bookingsTable.$inferSelect;
  customer?: typeof customersTable.$inferSelect | null;
  driver?: typeof driversTable.$inferSelect | null;
  truckType?: typeof truckTypesTable.$inferSelect | null;
}) {
  return {
    id: r.booking.id,
    customerId: r.booking.customerId,
    customerName: r.customer?.name ?? null,
    driverId: r.booking.driverId ?? null,
    driverName: r.driver?.name ?? null,
    driverPhone: r.driver?.phone ?? null,
    truckTypeId: r.booking.truckTypeId,
    truckTypeName: r.truckType?.name ?? null,
    pickupAddress: r.booking.pickupAddress,
    dropoffAddress: r.booking.dropoffAddress,
    distanceKm: parseFloat(r.booking.distanceKm),
    estimatedPrice: parseFloat(r.booking.estimatedPrice),
    finalPrice: r.booking.finalPrice ? parseFloat(r.booking.finalPrice) : null,
    status: r.booking.status,
    goodsDescription: r.booking.goodsDescription,
    notes: r.booking.notes ?? null,
    scheduledAt: r.booking.scheduledAt?.toISOString() ?? null,
    startedAt: r.booking.startedAt?.toISOString() ?? null,
    completedAt: r.booking.completedAt?.toISOString() ?? null,
    createdAt: r.booking.createdAt.toISOString(),
  };
}

// GET /admin/stats
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [bookingStats] = await db
    .select({
      total: count(),
      pending: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'pending')`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} IN ('accepted', 'in_progress'))`,
      completed: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'completed')`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'cancelled')`,
      revenue: sql<number>`COALESCE(SUM(${bookingsTable.finalPrice}) FILTER (WHERE ${bookingsTable.status} = 'completed'), 0)`,
    })
    .from(bookingsTable);

  const [driverStats] = await db
    .select({
      total: count(),
      available: sql<number>`COUNT(*) FILTER (WHERE ${driversTable.status} = 'available')`,
      busy: sql<number>`COUNT(*) FILTER (WHERE ${driversTable.status} = 'busy')`,
      offline: sql<number>`COUNT(*) FILTER (WHERE ${driversTable.status} = 'offline')`,
    })
    .from(driversTable);

  const [customerStats] = await db
    .select({ total: count() })
    .from(customersTable);

  res.json({
    totalBookings: Number(bookingStats.total),
    pendingBookings: Number(bookingStats.pending),
    activeBookings: Number(bookingStats.active),
    completedBookings: Number(bookingStats.completed),
    cancelledBookings: Number(bookingStats.cancelled),
    totalRevenue: parseFloat(String(bookingStats.revenue)) || 0,
    totalDrivers: Number(driverStats.total),
    availableDrivers: Number(driverStats.available),
    busyDrivers: Number(driverStats.busy),
    offlineDrivers: Number(driverStats.offline),
    totalCustomers: Number(customerStats.total),
  });
});

// GET /admin/bookings
router.get("/admin/bookings", async (req, res): Promise<void> => {
  const statusFilter = req.query["status"] as string | undefined;

  const rows = await db
    .select({
      booking: bookingsTable,
      customer: customersTable,
      driver: driversTable,
      truckType: truckTypesTable,
    })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(driversTable, eq(bookingsTable.driverId, driversTable.id))
    .leftJoin(truckTypesTable, eq(bookingsTable.truckTypeId, truckTypesTable.id))
    .orderBy(sql`${bookingsTable.createdAt} DESC`);

  const filtered = statusFilter
    ? rows.filter((r) => r.booking.status === statusFilter)
    : rows;

  res.json(filtered.map(formatAdminBooking));
});

// PATCH /admin/bookings/:id
router.patch("/admin/bookings/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid booking id" }); return; }

  const { status, driverId, finalPrice } = req.body as { status?: string; driverId?: number | null; finalPrice?: number | null };

  if (status !== undefined && !bookingStatuses.has(status)) {
    res.status(400).json({ error: "Invalid booking status" });
    return;
  }

  if (driverId !== undefined && driverId !== null) {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, Number(driverId)));
    if (!driver) { res.status(400).json({ error: "Driver not found" }); return; }
  }

  const changes: Partial<typeof bookingsTable.$inferInsert> = {};
  if (status !== undefined) changes.status = status as typeof bookingsTable.$inferInsert.status;
  if (driverId !== undefined) changes.driverId = driverId === null ? null : Number(driverId);
  if (finalPrice !== undefined) changes.finalPrice = finalPrice === null ? null : String(finalPrice);
  if (status === "in_progress") changes.startedAt = new Date();
  if (status === "completed") changes.completedAt = new Date();
  if (status === "completed" && finalPrice === undefined) {
    const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (existing) changes.finalPrice = existing.finalPrice ?? existing.estimatedPrice;
  }

  if (Object.keys(changes).length === 0) {
    res.status(400).json({ error: "No supported booking updates provided" });
    return;
  }

  const [updated] = await db.update(bookingsTable).set(changes).where(eq(bookingsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }

  if (updated.driverId && (status === "accepted" || status === "in_progress")) {
    await db.update(driversTable).set({ status: "busy" }).where(eq(driversTable.id, updated.driverId));
  }
  if (updated.driverId && (status === "completed" || status === "cancelled")) {
    await db.update(driversTable).set({ status: "available" }).where(eq(driversTable.id, updated.driverId));
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, updated.customerId));
  const driver = updated.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId)))[0] : null;
  const [truckType] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));
  res.json(formatAdminBooking({ booking: updated, customer, driver, truckType }));
});

// GET /admin/drivers
router.get("/admin/drivers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ driver: driversTable, truckType: truckTypesTable })
    .from(driversTable)
    .leftJoin(truckTypesTable, eq(driversTable.truckTypeId, truckTypesTable.id))
    .orderBy(sql`${driversTable.createdAt} DESC`);

  res.json(
    rows.map((r) => ({
      id: r.driver.id,
      name: r.driver.name,
      email: r.driver.email,
      phone: r.driver.phone,
      licenseNumber: r.driver.licenseNumber,
      vehiclePlate: r.driver.vehiclePlate,
      vehicleYear: r.driver.vehicleYear ?? null,
      truckTypeId: r.driver.truckTypeId ?? 0,
      truckTypeName: r.truckType?.name ?? null,
      status: r.driver.status,
      rating: parseFloat(r.driver.rating ?? "0"),
      totalTrips: r.driver.totalTrips ?? 0,
      createdAt: r.driver.createdAt.toISOString(),
    }))
  );
});

// PATCH /admin/drivers/:id
router.patch("/admin/drivers/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid driver id" }); return; }

  const { status } = req.body as { status?: string };
  if (!status || !driverStatuses.has(status)) {
    res.status(400).json({ error: "Invalid driver status" });
    return;
  }

  const [updated] = await db.update(driversTable)
    .set({ status: status as typeof driversTable.$inferInsert.status })
    .where(eq(driversTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Driver not found" }); return; }

  const [truckType] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    licenseNumber: updated.licenseNumber,
    vehiclePlate: updated.vehiclePlate,
    vehicleYear: updated.vehicleYear ?? null,
    truckTypeId: updated.truckTypeId ?? 0,
    truckTypeName: truckType?.name ?? null,
    status: updated.status,
    rating: parseFloat(updated.rating ?? "0"),
    totalTrips: updated.totalTrips ?? 0,
    createdAt: updated.createdAt.toISOString(),
  });
});

// GET /admin/customers
router.get("/admin/customers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      customer: customersTable,
      totalBookings: sql<number>`COUNT(${bookingsTable.id})`,
      totalSpent: sql<number>`COALESCE(SUM(${bookingsTable.finalPrice}) FILTER (WHERE ${bookingsTable.status} = 'completed'), 0)`,
    })
    .from(customersTable)
    .leftJoin(bookingsTable, eq(customersTable.id, bookingsTable.customerId))
    .groupBy(customersTable.id)
    .orderBy(sql`${customersTable.createdAt} DESC`);

  res.json(
    rows.map((r) => ({
      id: r.customer.id,
      name: r.customer.name,
      email: r.customer.email,
      phone: r.customer.phone,
      createdAt: r.customer.createdAt.toISOString(),
      totalBookings: Number(r.totalBookings),
      totalSpent: parseFloat(String(r.totalSpent)) || 0,
    }))
  );
});

export default router;
