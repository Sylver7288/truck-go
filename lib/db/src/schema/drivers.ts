import { pgTable, serial, text, integer, timestamp, numeric, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { truckTypesTable } from "./truck-types";

export const driverStatusEnum = pgEnum("driver_status", ["available", "busy", "offline"]);

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  vehiclePlate: text("vehicle_plate").notNull(),
  vehicleYear: integer("vehicle_year"),
  truckTypeId: integer("truck_type_id").references(() => truckTypesTable.id).notNull(),
  status: driverStatusEnum("status").notNull().default("offline"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  totalTrips: integer("total_trips").notNull().default(0),
  currentLat: doublePrecision("current_lat"),
  currentLng: doublePrecision("current_lng"),
  lastLocationAt: timestamp("last_location_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true, rating: true, totalTrips: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
