import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";

export const verifyAccessToken = asyncHandler(async (req, _, next) => {
    try {
        // get token from cookies or req headers in case cookies are not in use
        const token = req.cookies?.accessToken || req.headers(authorization)?.replace("Bearer " , "")
    
        // if token is not available return error
        if (!token) {
            throw new apiError(401 , "Access token is missing");
        }

        // verify token with jwt library
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // find user from userId available in accesstoken and retun user
        const user = await User.findById(decodedtoken._id).select(
            "-password -__v -createdAt -updatedAt -refreshToken"
        )
    
        // if user is not there then return 
        if (!user) {
            throw new apiError(404 , "User not found");
        }
    
        // add user in the request
        req.user = user;
        next(); // complete middleware process and start next processes
    } catch (error) {
        throw new apiError(401 , error.message || "Invalid access token");
    }
})