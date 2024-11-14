import express from "express";
import { activateUser, loginUser, logoutUser, registrationUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo, updatePassword, updateProfilePicture, getAllUsers, updateUserRole, deleteUser } from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";
const userRouter = express.Router();

console.log("Router setup");

userRouter.post("/registration", registrationUser as any);

userRouter.post("/activate-user", activateUser as any);

userRouter.post("/login", loginUser as any);

userRouter.get("/logout",isAuthenticated as any ,authorizeRoles("admin"), logoutUser as any);

userRouter.get("/refresh", updateAccessToken as any);

userRouter.get("/me",updateAccessToken as any, isAuthenticated as any, getUserInfo as any);

userRouter.post("/social-auth",updateAccessToken as any, socialAuth as any);

userRouter.put("/update-user-info",updateAccessToken as any, isAuthenticated as any, updateUserInfo as any);

userRouter.put("/update-user-password",updateAccessToken as any, isAuthenticated as any, updatePassword as any);

userRouter.put("/update-user-avatar",updateAccessToken as any, isAuthenticated as any, updateProfilePicture as any);

userRouter.get("/get-users",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), getAllUsers as any);

userRouter.put("/update-user",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), updateUserRole as any);

userRouter.delete("/delete-user/:id",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), deleteUser as any);

export default userRouter;
