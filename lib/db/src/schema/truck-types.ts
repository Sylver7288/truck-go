import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const truckTypesTable = pgTable("truck_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  capacityKg: numeric("capacity_kg", { precision: 10, scale: 2 }).notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerKm: numeric("price_per_km", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
});

export const insertTruckTypeSchema = createInsertSchema(truckTypesTable).omit({ id: true });
export type InsertTruckType = z.infer<typeof insertTruckTypeSchema>;
export type TruckType = typeof truckTypesTable.$inferSelect;
