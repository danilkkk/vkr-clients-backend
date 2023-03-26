import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import logger from './logger.js';

import authRouter from './routers/auth-router.js';
import errorMiddleware from "./middlewares/error-middleware.js";
import rolesRouter from "./routers/roles-router.js";
import usersRouter from "./routers/users-router.js";
import officesRouter from "./routers/offices-router.js";
import servicesRouter from "./routers/services-router.js";
import schedulePatternsRouter from "./routers/schedule-patterns-router.js";
import scheduleRouter from "./routers/schedule-router.js";

dotenv.config();

const PORT = process.env.PORT || 5005;
const DATABASE_URI = /*process.env.DB_URL ||*/ `mongodb://localhost:27017`;
const DB_NAME = process.env.DB_NAME || 'clients';

const app = express()
    .use(express.json())
    .use(cookieParser())
    .use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    })
    .use('/auth', authRouter)
    .use('/users', usersRouter)
    .use('/roles', rolesRouter)
    .use('/offices', officesRouter)
    .use('/services', servicesRouter)
    .use('/patterns', schedulePatternsRouter)
    .use('/schedule', scheduleRouter)
    .use(errorMiddleware);

app.response.getCurrentUser = function () {
    console.log('getCurrentUser');
    console.log(this.locals.currentUser);
    return this.locals.currentUser;
}

let server;

const startServer = async () => {
    const start = Date.now();

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

        server = app.listen(PORT, () => logger.info(`Server was started on port ${PORT} in ${(Date.now() - start).toFixed(2)} ms`));
    } catch (e) {
        logger.error(e);
    }
}

startServer();

const cleanUp = () => {
    logger.info('Stopping the server...');

    if (server) {
        server.close(() => {
            logger.info('Server is stopped.');

            mongoose.connection.close(false, () => {
                logger.info('Connection to MongoDB is closed.');
                process.exit(0);
            });
        });
    }
}

process.on('SIGTERM', cleanUp);
process.on('SIGINT', cleanUp);