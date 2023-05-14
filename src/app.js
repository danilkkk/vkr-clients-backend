import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRouter from './routers/auth-router.js';
import errorMiddleware from "./middlewares/error-middleware.js";
import rolesRouter from "./routers/roles-router.js";
import usersRouter from "./routers/users-router.js";
import officesRouter from "./routers/offices-router.js";
import servicesRouter from "./routers/services-router.js";
import schedulePatternsRouter from "./routers/schedule-patterns-router.js";
import scheduleRouter from "./routers/schedule-router.js";
import recordsRouter from "./routers/records-router.js";
import cors from 'cors'

dotenv.config();

const app = express()
    .use(express.json())
    .use(cookieParser())
    // .use((req, res, next) => {
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     next();
    // })
    .use(cors({
        credentials: true,
        origin: process.env.CLIENT_URL
    }))
    .use('/auth', authRouter)
    .use('/users', usersRouter)
    .use('/roles', rolesRouter)
    .use('/offices', officesRouter)
    .use('/services', servicesRouter)
    .use('/patterns', schedulePatternsRouter)
    .use('/schedule', scheduleRouter)
    .use('/records', recordsRouter)
    .use(errorMiddleware);

app.response.getCurrentUser = function () {
    console.log('getCurrentUser');
    console.log(this.locals.currentUser);
    return this.locals.currentUser;
}

export default app;
