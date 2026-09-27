import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found while generating tokens");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(500 , "Token generation failed");
    }
};

/*
    API function for register user in application.
*/ 

const registerUser = asyncHandler(async (req, res) => {
    const { username , email , password , firstname , lastname } = req.body;

    if (!username.trim() ) {
        throw new apiError(444 , "Please Enter username")
    }
    
    if (!email.trim() ) {
        throw new apiError(444 , "Please Enter email")
    }

    if (password.length < 6) {
        throw new apiError(444 , "Make your password strong with min 6 character")
    }

    const existedEmail = await User.findOne({email});
    if (existedEmail) {
        throw new apiError(402 , "User with this email already exists, please use a different email")
    }

    const existedUsername = await User.findOne({username});
    if (existedUsername) {
        throw new apiError(402 , "User with this username already exists, please choose a different username")
    }

    const registerUser = await User.create({ username, email, password, firstname, lastname });

    const createdUser = await User.findById(registerUser._id).select(
        "-password -__v -createdAt -updatedAt -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500 , "User registration failed on registeration");
    }

    return res.status(201).json(
        new apiResponse(201 , createdUser , "User registered successfully")
    )
})

/*
    API function for login user in application.
*/ 

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(email?.trim() || username?.trim())) {
        throw new apiError(444 , "Email or Username is required");
    }
    if (password?.trim() === "") {
        throw new apiError(444 , "Password is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    // console.log("User found for login:", user); // Debugging line

    if (!user) {
        throw new apiError(404 , "Your credentials are invalid, please check your email or username");
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);

    if (!isPasswordMatch) {
        throw new apiError(404 , "Your credentials are invalid, please check your email or username");
    }

    // await generateAccessTokenAndRefreshToken(user._id).then(({ accessToken, refreshToken }) => {
    //     return res.status(200).json(
    //         new apiResponse(200 , {
    //             accessToken,
    //             refreshToken
    //         } , "User logged in successfully")
    //     )
    // })

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -__v -createdAt -updatedAt -refreshToken"
    );

    const options = {
        httpOnly : true,
        secure: true,
        sameSite: "none"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

/*
    API function for log-out user in application.
*/ 

const logoutUser = asyncHandler(async (req, res) => {
    // get user id from request
    req.user._id

    // find user in db and undefined refresh token
    await User.findByIdAndUpdate(
        req.user._id , 
        {$unset: {refreshToken: undefined}} ,
        {new: true}
    )
    
    // for setup and updates cookies
    const options = {
        httpOnly : true,
        secure: true,
        sameSite: "none"
    }

    // clear cookie and send response ok
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200 , null , "User logged out successfully")
    )
})

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "-password -__v -createdAt -updatedAt -refreshToken"
    );

    if (!user) {
        throw new apiError(
            404,
            "User not found"
        );
    }

    return res.status(200).json(
        new apiResponse(
            200,
            user,
            "Profile fetched successfully"
        )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookie or body
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new apiError(401, "Refresh token is required");
    }

    // Verify the incoming refresh token
    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (error) {
        throw new apiError(401, "Invalid or expired refresh token");
    }

    // Find user and match token
    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new apiError(401, "Refresh token is already used or invalid");
    }

    // Generate fresh tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully"
            )
        );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { firstname, lastname, username } = req.body;

    // At least one field must be provided
    if (!firstname?.trim() && !lastname?.trim() && !username?.trim()) {
        throw new apiError(400, "Please provide at least one field to update");
    }

    // If username is being changed, check it's not already taken
    if (username?.trim()) {
        const existingUser = await User.findOne({ 
            username: username.toLowerCase(),
            _id: { $ne: req.user._id }  // exclude current user
        });
        if (existingUser) {
            throw new apiError(409, "Username is already taken");
        }
    }

    // Build update object dynamically (only update provided fields)
    const updateFields = {};
    if (firstname?.trim()) updateFields.firstname = firstname.trim();
    if (lastname?.trim())  updateFields.lastname  = lastname.trim();
    if (username?.trim())  updateFields.username  = username.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken -__v");

    if (!updatedUser) {
        throw new apiError(500, "Profile update failed");
    }

    return res.status(200).json(
        new apiResponse(200, updatedUser, "Profile updated successfully")
    );
});

const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new apiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (user) {
        
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const hashedOTP = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        user.forgotPasswordOTP = hashedOTP;
        user.forgotPasswordOTPExpiry = new Date(
            Date.now() + 10 * 60 * 1000 // 10 minutes
        );

        await user.save({ validateBeforeSave: false });

        await sendEmail(
            user.email,
            "Password Reset OTP",
            `
            <h2>Password Reset Request</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            `
        );
    }

    return res.status(200).json(
        new apiResponse(
            200,
            null,
            "If that email exists, an OTP has been sent"
        )
    );
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
        throw new apiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        throw new apiError(404, "Email and OTP are required");
    }
    
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
        throw new apiError(429, `Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    if (!user.forgotPasswordOTP || user.forgotPasswordOTPExpiry < new Date()) {
        throw new apiError(400, "OTP has expired. Please request a new one.");
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.forgotPasswordOTP !== hashedOTP) {
        user.otpAttempts += 1;

        // Lock account's OTP flow after 5 failed attempts
        if (user.otpAttempts >= 5) {
            user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
            user.otpAttempts = 0;
        }

        await user.save({ validateBeforeSave: false });
        throw new apiError(400, "Invalid OTP");
    }

    // Success - reset attempt counter
    // await user.save({ validateBeforeSave: false });
    
    // in verifyOTP, after validating:
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.forgotPasswordOTP = null;
    user.forgotPasswordOTPExpiry = null;
    user.otpLockedUntil = null;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new apiResponse(
            200,
            resetToken,
            "OTP verified successfully"
        )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken?.trim() || !newPassword?.trim()) {
        throw new apiError(400, "Reset token and new password are required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
        throw new apiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;

    user.forgotPasswordOTP = null;
    user.forgotPasswordOTPExpiry = null;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.otpAttempts = 0;
    user.otpLockedUntil = null;

    await user.save();

    return res.status(200).json(
        new apiResponse(
            200,
            null,
            "Password reset successfully"
        )
    );
});

export { registerUser, loginUser, logoutUser, getUserProfile, refreshAccessToken, updateUserProfile, resetPassword, verifyOTP, forgetPassword };