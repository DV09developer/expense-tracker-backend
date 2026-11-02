const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,              // HTTPS only in production
    sameSite: "lax",             // frontend and proxied API share one origin
    path: "/",
};