import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, customersTable, driversTable } from "@workspace/db";
import { CreateReviewBody, ListDriverReviewsParams } from "@workspace/api-zod";

const router: IRouter = Router();

// POST /reviews
router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { bookingId, customerId, driverId, rating, comment } = parsed.data;

  const [review] = await db.insert(reviewsTable).values({
    bookingId,
    customerId,
    driverId,
    rating,
    comment: comment ?? null,
  }).returning();

  // Update driver average rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.driverId, driverId));
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db.update(driversTable).set({ rating: avg.toFixed(2) }).where(eq(driversTable.id, driverId));

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));

  res.status(201).json({
    id: review.id,
    bookingId: review.bookingId,
    customerId: review.customerId,
    customerName: customer?.name ?? null,
    driverId: review.driverId,
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: review.createdAt.toISOString(),
  });
});

// GET /reviews/driver/:driverId
router.get("/reviews/driver/:driverId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.driverId) ? req.params.driverId[0] : req.params.driverId;
  const parsed = ListDriverReviewsParams.safeParse({ driverId: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid driverId" }); return; }

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.driverId, parsed.data.driverId));

  const result = await Promise.all(reviews.map(async (r) => {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, r.customerId));
    return {
      id: r.id,
      bookingId: r.bookingId,
      customerId: r.customerId,
      customerName: customer?.name ?? null,
      driverId: r.driverId,
      rating: r.rating,
      comment: r.comment ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
