import { Router } from "express";

import {
    getDashboardData,
    getCategoryBreakdown,
    getMonthlyExpenses
} from "../controllers/dashboard.controller.js";

import { verifyAccessToken }
from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyAccessToken);

router.get("/", getDashboardData);

router.get(
    "/category-breakdown",
    getCategoryBreakdown
);

router.get(
    "/monthly-expenses",
    getMonthlyExpenses
);

export default router;