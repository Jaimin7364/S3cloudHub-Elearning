import express from "express";
import { editCourse, getSingleCourse, uploadCourse, getAllCourses, getCourseByUser, addQuestion, addAnwser, getAllCoursesWithoutPurchasing, deleteCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";
const courseRouter = express.Router();

courseRouter.post("/create-course", updateAccessToken as any, isAuthenticated as any, authorizeRoles("admin") as express.RequestHandler, uploadCourse as any);

courseRouter.put("/edit-course/:id", isAuthenticated as any, authorizeRoles("admin") as express.RequestHandler, editCourse as any);

courseRouter.get("/get-course/:id", getSingleCourse as any);

courseRouter.get("/get-courses", getAllCoursesWithoutPurchasing as any);

courseRouter.get("/get-course-content/:id",isAuthenticated as any, getCourseByUser as any);

courseRouter.put("/add-question",isAuthenticated as any, addQuestion as any);

courseRouter.put("/add-answer",isAuthenticated as any, addAnwser as any);

courseRouter.put("/get-courses", isAuthenticated as any, authorizeRoles("admin") as express.RequestHandler, getAllCourses as any);

courseRouter.delete("/delete-course/:id", isAuthenticated as any, authorizeRoles("admin") as express.RequestHandler, deleteCourse as any);

export default courseRouter;