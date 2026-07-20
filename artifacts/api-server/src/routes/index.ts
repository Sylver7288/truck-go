import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import truckTypesRouter from "./truck-types";
import estimatesRouter from "./estimates";
import bookingsRouter from "./bookings";
import driversRouter from "./drivers";
import reviewsRouter from "./reviews";
import adminRouter from "./admin";
import adminAuthRouter, { requireAdminSession } from "./admin-auth";
import contactRouter from "./contact";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(truckTypesRouter);
router.use(estimatesRouter);
router.use(bookingsRouter);
router.use(driversRouter);
router.use(reviewsRouter);
router.use(adminAuthRouter);
router.use("/admin", requireAdminSession);
router.use(adminRouter);
router.use(contactRouter);
router.use(chatRouter);

export default router;
