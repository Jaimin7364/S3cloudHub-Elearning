import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order",updateAccessToken as any,isAuthenticated as any, createOrder as any);

orderRouter.get("/get-orders",updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin"), getAllOrders as any);

orderRouter.get("/payment/stripepublishablekey",sendStripePublishableKey as any);

orderRouter.post("/payment",isAuthenticated as any,newPayment as any);


export default orderRouter;