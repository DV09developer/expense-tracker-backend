import { Router } from "express";

import userRoutes from "./user.routes.js";
import transactionRoutes from "./transaction.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);

export default router;