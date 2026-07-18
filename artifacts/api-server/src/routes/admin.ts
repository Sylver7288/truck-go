import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, bookingsTable, customersTable, driversTable, truckTypesTable } from "@workspace/db";

const router: IRouter = Router();

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

  res.json(
    filtered.map((r) => ({
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
    }))
  );
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
