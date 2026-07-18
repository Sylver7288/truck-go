import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, truckTypesTable } from "@workspace/db";
import { GetTruckTypeParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /truck-types
router.get("/truck-types", async (_req, res): Promise<void> => {
  const types = await db.select().from(truckTypesTable);
  res.json(types.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    capacityKg: parseFloat(t.capacityKg),
    basePrice: parseFloat(t.basePrice),
    pricePerKm: parseFloat(t.pricePerKm),
    imageUrl: t.imageUrl ?? null,
  })));
});

// GET /truck-types/:id
router.get("/truck-types/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetTruckTypeParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [type] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.id, parsed.data.id));
  if (!type) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: type.id,
    name: type.name,
    description: type.description,
    capacityKg: parseFloat(type.capacityKg),
    basePrice: parseFloat(type.basePrice),
    pricePerKm: parseFloat(type.pricePerKm),
    imageUrl: type.imageUrl ?? null,
  });
});

export default router;
