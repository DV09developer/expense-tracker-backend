import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUserProfile, 
  updateUserProfile, 
  refreshAccessToken, 
  forgetPassword, 
  resetPassword,
  verifyOTP
} from "../controllers/user.controller.js";
import { forgotPasswordLimiter, verifyOTPLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyAccessToken, logoutUser);

router.route("/profile").get(verifyAccessToken, getUserProfile);
router.route("/update-profile").patch(verifyAccessToken, updateUserProfile);

router.route("/refresh-token").post(refreshAccessToken);


router.route("/forgot-password").post(forgotPasswordLimiter, forgetPassword);
router.route("/verify-otp").post(verifyOTPLimiter, verifyOTP);
router.route("/reset-password").post(verifyOTPLimiter, resetPassword); 

export default router;