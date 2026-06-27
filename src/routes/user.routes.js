import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { loginUser , registerUser , logoutUser , getUserProfile , refreshAccessToken , updateUserProfile } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(logoutUser);

router.route("/profile").get(
  verifyAccessToken,
  getUserProfile
);

router.route("/refresh-token").post(refreshAccessToken);

router.patch("/update-profile", verifyAccessToken, updateUserProfile);


export default router;