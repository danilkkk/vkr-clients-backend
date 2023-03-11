import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import logger from './logger.js';

import usersRouter from './routers/users-router.js';
import errorMiddleware from "./middlewares/error-middleware.js";

dotenv.config();

const PORT = process.env.PORT ?? 5005;
const DATABASE_URI = process.env.DB_URL ?? `mongodb://localhost:27017`;
const DB_NAME = process.env.DB_NAME ?? 'clients';

const app = express()
    .use(express.json())
    .use(cookieParser())
    .use(cors({
        credentials: true,
        origin: process.env.CLIENT_URL
    }))
    .use('/users', usersRouter)
    .use(errorMiddleware);

const startServer = async () => {
    const start = performance.now();

    try {
        logger.info('Starting server...');

        await mongoose.connect(DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DB_NAME,
        }, (e) => {
            if (e) {
                logger.error(e);
            } else {
                logger.info('Database is connected')
            }
        });

        app.listen(PORT, () => logger.info(`Server was started on port ${PORT} in ${(performance.now() - start).toFixed(2)} ms`));
    } catch (e) {
        logger.error(e);
    }
}

startServer();