import { Request,Response,NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler  from "../utils/ErrorHandler"; // Add this import statement
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";


// Check if user is authenticated or not
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler("Login first to access this resource", 400));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string);

    if (!decoded) {
        return next(new ErrorHandler("access token is not valid", 400));
    }

    const user = await redis.get((decoded as JwtPayload).id);

    if (!user) {
        return next(new ErrorHandler("User not found with this access token. Please login again", 400));
    }

    req.user = JSON.parse(user);

    next();

});

// validate user roles

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role (${req.user?.role}) is not allowed to access this resource`, 403));
        }
        next();
    }
}