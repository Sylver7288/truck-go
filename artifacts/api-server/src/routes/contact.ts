import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessages } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

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

export default router;
