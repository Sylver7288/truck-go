import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import {
  bookingsTable,
  contactMessages,
  customersTable,
  driversTable,
  reviewsTable,
  truckTypesTable,
} from "./schema";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function getTruckTypeId(name: string): Promise<number> {
  const [truckType] = await db.select().from(truckTypesTable).where(eq(truckTypesTable.name, name));
  if (!truckType) {
    throw new Error(`Missing seeded truck type: ${name}`);
  }
  return truckType.id;
}

async function getCustomerId(email: string): Promise<number> {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
  if (!customer) {
    throw new Error(`Missing seeded customer: ${email}`);
  }
  return customer.id;
}

async function getDriverId(email: string): Promise<number> {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.email, email));
  if (!driver) {
    throw new Error(`Missing seeded driver: ${email}`);
  }
  return driver.id;
}

async function seedTruckTypes() {
  const existing = await db.select().from(truckTypesTable);
  const existingNames = new Set(existing.map((truckType) => truckType.name));

  const truckTypes: Array<typeof truckTypesTable.$inferInsert> = [
    {
      name: "Van",
      description: "Best for parcels, small furniture, and apartment moves.",
      capacityKg: "1000.00",
      basePrice: "45.00",
      pricePerKm: "2.20",
      imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Small Truck",
      description: "Good for studio moves, whitegoods, and business deliveries.",
      capacityKg: "2500.00",
      basePrice: "75.00",
      pricePerKm: "3.10",
      imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Large Truck",
      description: "For larger homes, bulky cargo, and commercial haulage.",
      capacityKg: "6000.00",
      basePrice: "130.00",
      pricePerKm: "4.60",
      imageUrl: "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const missing = truckTypes.filter((truckType) => !existingNames.has(truckType.name));
  if (missing.length > 0) {
    await db.insert(truckTypesTable).values(missing);
  }
}

async function seedCustomers() {
  await db.insert(customersTable).values([
    {
      name: "Ava Mitchell",
      email: "ava.customer@truckgo.test",
      phone: "+61 400 100 101",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
    },
    {
      name: "Noah Patel",
      email: "noah.customer@truckgo.test",
      phone: "+61 400 100 102",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
    },
    {
      name: "Mia Chen",
      email: "mia.customer@truckgo.test",
      phone: "+61 400 100 103",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
    },
  ]).onConflictDoNothing({ target: customersTable.email });

  await db.update(customersTable).set({ emailVerifiedAt: new Date() }).where(eq(customersTable.email, "ava.customer@truckgo.test"));
  await db.update(customersTable).set({ emailVerifiedAt: new Date() }).where(eq(customersTable.email, "noah.customer@truckgo.test"));
  await db.update(customersTable).set({ emailVerifiedAt: new Date() }).where(eq(customersTable.email, "mia.customer@truckgo.test"));
}

async function seedDrivers() {
  const vanId = await getTruckTypeId("Van");
  const smallTruckId = await getTruckTypeId("Small Truck");
  const largeTruckId = await getTruckTypeId("Large Truck");

  await db.insert(driversTable).values([
    {
      name: "Jack Wilson",
      email: "jack.driver@truckgo.test",
      phone: "+61 411 200 201",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
      licenseNumber: "NSW-DL-9001",
      vehiclePlate: "TG-101",
      vehicleYear: 2021,
      truckTypeId: vanId,
      status: "available",
      rating: "4.90",
      totalTrips: 128,
      currentLat: -33.8688,
      currentLng: 151.2093,
      lastLocationAt: new Date(),
    },
    {
      name: "Sophia Garcia",
      email: "sophia.driver@truckgo.test",
      phone: "+61 411 200 202",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
      licenseNumber: "NSW-DL-9002",
      vehiclePlate: "TG-202",
      vehicleYear: 2020,
      truckTypeId: smallTruckId,
      status: "busy",
      rating: "4.80",
      totalTrips: 96,
      currentLat: -33.8846,
      currentLng: 151.2166,
      lastLocationAt: new Date(),
    },
    {
      name: "Liam Brown",
      email: "liam.driver@truckgo.test",
      phone: "+61 411 200 203",
      passwordHash: hashPassword("password123"),
      emailVerifiedAt: new Date(),
      licenseNumber: "NSW-DL-9003",
      vehiclePlate: "TG-303",
      vehicleYear: 2022,
      truckTypeId: largeTruckId,
      status: "offline",
      rating: "4.70",
      totalTrips: 74,
    },
  ]).onConflictDoNothing({ target: driversTable.email });

  await db.update(driversTable).set({ emailVerifiedAt: new Date() }).where(eq(driversTable.email, "jack.driver@truckgo.test"));
  await db.update(driversTable).set({ emailVerifiedAt: new Date() }).where(eq(driversTable.email, "sophia.driver@truckgo.test"));
  await db.update(driversTable).set({ emailVerifiedAt: new Date() }).where(eq(driversTable.email, "liam.driver@truckgo.test"));
}

async function seedBookings() {
  const existing = await db.select().from(bookingsTable).limit(1);
  if (existing.length > 0) return;

  const avaId = await getCustomerId("ava.customer@truckgo.test");
  const noahId = await getCustomerId("noah.customer@truckgo.test");
  const miaId = await getCustomerId("mia.customer@truckgo.test");
  const jackId = await getDriverId("jack.driver@truckgo.test");
  const sophiaId = await getDriverId("sophia.driver@truckgo.test");
  const vanId = await getTruckTypeId("Van");
  const smallTruckId = await getTruckTypeId("Small Truck");
  const largeTruckId = await getTruckTypeId("Large Truck");

  await db.insert(bookingsTable).values([
    {
      customerId: avaId,
      driverId: jackId,
      truckTypeId: vanId,
      pickupAddress: "12 King Street, Newtown NSW",
      dropoffAddress: "88 George Street, Sydney NSW",
      distanceKm: "6.80",
      estimatedPrice: "59.96",
      finalPrice: "59.96",
      status: "completed",
      goodsDescription: "Two bookshelves and boxed household items",
      notes: "Customer requested careful handling for glassware.",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 47),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 45),
    },
    {
      customerId: noahId,
      driverId: sophiaId,
      truckTypeId: smallTruckId,
      pickupAddress: "44 Oxford Street, Paddington NSW",
      dropoffAddress: "19 Harris Street, Pyrmont NSW",
      distanceKm: "9.40",
      estimatedPrice: "104.14",
      status: "accepted",
      goodsDescription: "Cafe equipment and stock boxes",
      notes: "Pickup from rear loading bay.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 4),
    },
    {
      customerId: miaId,
      truckTypeId: largeTruckId,
      pickupAddress: "5 Victoria Road, Parramatta NSW",
      dropoffAddress: "72 Pacific Highway, North Sydney NSW",
      distanceKm: "24.20",
      estimatedPrice: "241.32",
      status: "pending",
      goodsDescription: "Office desks, filing cabinets, and monitors",
      notes: "Needs lift-gate truck if available.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  ]);
}

async function seedReviews() {
  const existing = await db.select().from(reviewsTable).limit(1);
  if (existing.length > 0) return;

  const [completedBooking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "completed"))
    .limit(1);

  if (!completedBooking || !completedBooking.driverId) return;

  await db.insert(reviewsTable).values({
    bookingId: completedBooking.id,
    customerId: completedBooking.customerId,
    driverId: completedBooking.driverId,
    rating: 5,
    comment: "Friendly driver, on time, and the move was handled carefully.",
  }).onConflictDoNothing({ target: reviewsTable.bookingId });
}

async function seedContactMessages() {
  const existing = await db.select().from(contactMessages).limit(1);
  if (existing.length > 0) return;

  await db.insert(contactMessages).values([
    {
      name: "Olivia Turner",
      email: "olivia@example.com",
      subject: "business account",
      message: "We need weekly deliveries between our warehouse and two retail locations. Could someone contact me about business pricing?",
      status: "new",
    },
    {
      name: "Ethan Morris",
      email: "ethan@example.com",
      subject: "booking_issue",
      message: "I need to update the drop-off time for a booking I made this morning.",
      status: "in_review",
    },
  ]);
}

async function main() {
  await seedTruckTypes();
  await seedCustomers();
  await seedDrivers();
  await seedBookings();
  await seedReviews();
  await seedContactMessages();
  console.log("Seed data loaded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
