import { NextFunction, Request, response, Response } from "express";
import mongoose from "mongoose";
import { redis } from "../utils/redis"; // Adjust the path as necessary
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail"; // Adjust the path as necessary
import NotificationModel from "../models/notificaionModel"; // Adjust the path as necessary
import { getAllCoursesService } from "../services/course.service"; // Adjust the path as necessary

// Upload course
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        if (thumbnail) {
            // Upload thumbnail to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            // Attach Cloudinary response to data
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        createCourse(data, res, next);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// edit course
export const editCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;
            if (thumbnail) {
                await cloudinary.v2.uploader.destroy(thumbnail.public_id);
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            const courseId = req.params.id;
            const course = await CourseModel.findByIdAndUpdate(
                courseId, {
                $set: data
            },
                {
                    new: true
                });
            res.status(201).json({
                success: true,
                course,
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get single course --without purchasing
export const getSingleCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const courseId = req.params.id;
            const isCacheExist = await redis.get(courseId);
            if (isCacheExist) {
                const course = JSON.parse(isCacheExist);
                res.status(200).json({
                    success: true,
                    course,
                });
            }

            else {
                const course = await CourseModel.findById(req.params.id).select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                );
                res.status(200).json({
                    success: true,
                    course,
                });

                await redis.set(courseId, JSON.stringify(course), "EX", 60 * 60 * 24 * 7);
            }


        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get all courses without purchasing
export const getAllCoursesWithoutPurchasing = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExist = await redis.get("allCourses");
        if (isCacheExist) {
            const courses = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = await CourseModel.find().select("-courseData.videoürl-courseData.suggestion-courseData.questions -courseData.links");
            res.status(200).json({
                success: true,
                courses
            });

            await redis.set("allCourses", JSON.stringify(courses));
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// get course content only for valid user
export const getCourseByUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;
            const courseExists = userCourseList?.find(
                (course: any) => course._id.toString() === courseId.toString()
            );
            if (!courseExists) {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 404));
            }
            const course = await CourseModel.findById(courseId);
            const content = course?.courseData;
            res.status(200).json({
                success: true,
                content,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


// add question in course
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}
export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        const couseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));
        if (!couseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }
        // create a new question object
        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add this question to our course content
        couseContent.questions.push(newQuestion);

        await NotificationModel.create({
            user: req.user?._id,
            title: "New Question",
            message: `You have a new question from ${couseContent.title}`,
        });

        //save the updated course
        await course?.save();

        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// add answer in course question
interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}
export const addAnwser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }
        const couseContent = course?.courseData?.find((item: any) =>
            item._id.equals(contentId)
        );
        if (!couseContent) {
            return next(new ErrorHandler("Invalid content id", 400));
        }
        const question = couseContent?.questions?.find((item: any) =>
            item._id.equals(questionId)
        );
        if (!question) {
            return next(new ErrorHandler("Invalid question id", 400));
        }
        // create a new answer object
        const newAnswer: any = {
            user: req.user,
            answer,
        }
        // add this answer to our course content

        question.questionReplies.push(newAnswer);

        // save the updated course

        await course?.save();

        if (req.user?._id === question.user._id) {
            // create a notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${couseContent.title}`,
                });
        } else {
            const data = {
                name: question.user.name,
                title: couseContent.title,
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"),
                data);
            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// get all courses only for admin
export const getAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        getAllCoursesService(res);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
  );

  // Delete user only for admin
export const deleteCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const course = await CourseModel.findById(id);
        if (!course) {
          return next(new ErrorHandler("course not found", 404));
        }
        await course.deleteOne({ id });
        await redis.del(id);
        res.status(200).json({
          success: true,
          message: "course deleted successfully",
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
  );