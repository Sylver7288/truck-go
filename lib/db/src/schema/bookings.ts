import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { driversTable } from "./drivers";
import { truckTypesTable } from "./truck-types";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id).notNull(),
  driverId: integer("driver_id").references(() => driversTable.id),
  truckTypeId: integer("truck_type_id").references(() => truckTypesTable.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  distanceKm: numeric("distance_km", { precision: 10, scale: 2 }).notNull(),
  estimatedPrice: numeric("estimated_price", { precision: 10, scale: 2 }).notNull(),
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  goodsDescription: text("goods_description").notNull(),
  notes: text("notes"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, status: true, finalPrice: true, startedAt: true, completedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
