import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, driversTable, truckTypesTable, bookingsTable, reviewsTable } from "@workspace/db";
import {
  GetDriverParams,
  UpdateDriverStatusParams,
  UpdateDriverStatusBody,
  ListDriverJobsParams,
  GetDriverStatsParams,
  UpdateDriverLocationParams,
  UpdateDriverLocationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatDriver(d: typeof driversTable.$inferSelect, truckTypeName?: string | null) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    licenseNumber: d.licenseNumber,
    vehiclePlate: d.vehiclePlate,
    vehicleYear: d.vehicleYear ?? null,
    truckTypeId: d.truckTypeId,
    truckTypeName: truckTypeName ?? null,
    status: d.status,
    rating: parseFloat(d.rating),
    totalTrips: d.totalTrips,
    currentLat: d.currentLat ?? null,
    currentLng: d.currentLng ?? null,
    lastLocationAt: d.lastLocationAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

// GET /drivers/available
router.get("/drivers/available", async (req, res): Promise<void> => {
  const truckTypeId = req.query["truckTypeId"] ? parseInt(req.query["truckTypeId"] as string, 10) : undefined;

  const conditions: any[] = [eq(driversTable.status, "available")];
  if (truckTypeId) {
    conditions.push(eq(driversTable.truckTypeId, truckTypeId));
  }

  const drivers = await db.select().from(driversTable).where(and(...conditions));

  const result = await Promise.all(drivers.map(async (d) => {
    const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, d.truckTypeId));
    return formatDriver(d, tt?.name);
  }));

  res.json(result);
});

// GET /drivers/:id
router.get("/drivers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetDriverParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, parsed.data.id));
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }

  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, driver.truckTypeId));
  res.json(formatDriver(driver, tt?.name));
});

// PATCH /drivers/:id/status
router.patch("/drivers/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const idParsed = UpdateDriverStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!idParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const bodyParsed = UpdateDriverStatusBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }

  const [updated] = await db.update(driversTable)
    .set({ status: bodyParsed.data.status as any })
    .where(eq(driversTable.id, idParsed.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, updated.truckTypeId));
  res.json(formatDriver(updated, tt?.name));
});

// GET /drivers/:id/jobs
router.get("/drivers/:id/jobs", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListDriverJobsParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const jobs = await db.select().from(bookingsTable).where(eq(bookingsTable.driverId, parsed.data.id));

  const result = await Promise.all(jobs.map(async (b) => {
    const [tt] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, b.truckTypeId));
    return {
      id: b.id,
      customerId: b.customerId,
      customerName: null,
      driverId: b.driverId ?? null,
      driverName: null,
      driverPhone: null,
      truckTypeId: b.truckTypeId,
      truckTypeName: tt?.name ?? null,
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
  }));

  res.json(result);
});

// GET /drivers/:id/stats
router.get("/drivers/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetDriverStatsParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, parsed.data.id));
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }

  const jobs = await db.select().from(bookingsTable).where(eq(bookingsTable.driverId, parsed.data.id));
  const completed = jobs.filter(j => j.status === "completed");
  const cancelled = jobs.filter(j => j.status === "cancelled");
  const totalEarnings = completed.reduce((sum, j) => sum + parseFloat(j.finalPrice ?? j.estimatedPrice), 0);

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.driverId, parsed.data.id));
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : parseFloat(driver.rating);

  res.json({
    driverId: driver.id,
    totalTrips: jobs.length,
    completedTrips: completed.length,
    cancelledTrips: cancelled.length,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    rating: Math.round(avgRating * 100) / 100,
    reviewCount: reviews.length,
  });
});

// PATCH /drivers/:id/location
router.patch("/drivers/:id/location", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const idParsed = UpdateDriverLocationParams.safeParse({ id: parseInt(raw, 10) });
  if (!idParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const bodyParsed = UpdateDriverLocationBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }

  const [updated] = await db.update(driversTable)
    .set({
      currentLat: bodyParsed.data.lat,
      currentLng: bodyParsed.data.lng,
      lastLocationAt: new Date(),
    })
    .where(eq(driversTable.id, idParsed.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    driverId: updated.id,
    lat: updated.currentLat!,
    lng: updated.currentLng!,
    updatedAt: updated.lastLocationAt!.toISOString(),
  });
});

export default router;
