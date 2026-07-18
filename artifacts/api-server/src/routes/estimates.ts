import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, truckTypesTable } from "@workspace/db";
import { GetPriceEstimateBody } from "@workspace/api-zod";

const router: IRouter = Router();

// POST /estimates
router.post("/estimates", async (req, res): Promise<void> => {
  const parsed = GetPriceEstimateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { truckTypeId, distanceKm } = parsed.data;

  const [type] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, truckTypeId));
  if (!type) { res.status(404).json({ error: "Truck type not found" }); return; }

  const basePrice = parseFloat(type.basePrice);
  const pricePerKm = parseFloat(type.pricePerKm);
  const estimatedTotal = basePrice + pricePerKm * distanceKm;
  const estimatedMinutes = Math.round(distanceKm * 3); // ~20km/h average for urban delivery

  res.json({
    truckTypeId,
    distanceKm,
    basePrice,
    pricePerKm,
    estimatedTotal: Math.round(estimatedTotal * 100) / 100,
    estimatedMinutes,
  });
});

export default router;
