import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { loginUser , registerUser , logoutUser , getUserProfile } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(logoutUser);

router.route("/profile").get(
  verifyAccessToken,
  getUserProfile
);

export default router;