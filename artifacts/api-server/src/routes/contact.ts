import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessages } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

// POST /contact — submit a contact form message
router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const [row] = await db
    .insert(contactMessages)
    .values({ name, email, subject, message })
    .returning();

  return res.status(201).json({ id: row.id, message: "Message received. We'll get back to you within 24 hours." });
});

// GET /admin/contact — admin view of contact messages
router.get("/admin/contact", async (_req, res) => {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);
  return res.json(rows);
});

// PATCH /admin/contact/:id — update contact message workflow status
router.patch("/admin/contact/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };
  const allowedStatuses = new Set(["new", "in_review", "resolved", "archived"]);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid message id." });
  }

  if (!status || !allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Invalid message status." });
  }

  const [row] = await db
    .update(contactMessages)
    .set({ status })
    .where(eq(contactMessages.id, id))
    .returning();

  if (!row) {
    return res.status(404).json({ error: "Message not found." });
  }

  return res.json(row);
});

export default router;
