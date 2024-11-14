require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {ErrorMiddleware} from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.routes';
import notificationRouter from './routes/notification.route';
import layoutRouter from './routes/layout.route';

export const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

//cors => Cross-Origin Resource Sharing

// app.use(cors({
//     origin: ['http://localhost:3000'],
//     credentials: true
// }));

// CORS => Cross-Origin Resource Sharing
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));

// Routes

app.use('/api/v1', userRouter);
app.use('/api/v1', courseRouter);
app.use('/api/v1', orderRouter);
app.use('/api/v1', notificationRouter);
app.use('/api/v1', layoutRouter);

// Testing API
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: 'API is working'
    });
});

//unhandled routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server`);
    res.status(404);
    next(err);
});


app.use(ErrorMiddleware);