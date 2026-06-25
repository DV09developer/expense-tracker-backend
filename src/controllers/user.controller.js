import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";

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

    const existedEmail = await User.findOne(email);
    if (existedEmail) {
        throw new apiError(402 , "User is already exists please change your email")
    }

    const existedUsername = await User.findOne(username);
    if (existedUsername) {
        throw new apiError(402 , "User is already exists please change your username")
    }

    const registerUser = await User.create({ username, email, password, firstname, lastname });

    const createdUser = await User.findById(registerUser._id).select(
        "-passwoed -__v -createdAt -updatedAt -refreshToken"
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

    if (!user) {
        throw new apiError(404 , "User not found");
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);

    if (!isPasswordMatch) {
        throw new apiError(401 , "Invalid password");
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
        httponly : true,
        secure: true
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
        httponly : true,
        secure: true
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

export {registerUser , loginUser , logoutUser};