import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";
import { getNotifications, updateNotification } from "../controllers/notification.controller";
const notificationRoute = express.Router();

notificationRoute.get("/get-all-notifications",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), getNotifications as any);

notificationRoute.put("/update-notification/:id",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), updateNotification as any);

export default notificationRoute;