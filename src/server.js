import dotenv from 'dotenv';
import mongoose from "mongoose";
import logger from "./logger.js";
import telegramBot from "./chat-bots/telegram-bot.js";
import startNotify from "./services/notifier-service.js";
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5005;
const DATABASE_URI = process.env.DB_URL /* `mongodb://localhost:27017`*/;
const DB_NAME = process.env.DB_NAME || 'clients';

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

        server = app.listen(PORT, () => {
            logger.info(`Server was started on port ${PORT} in ${(Date.now() - start).toFixed(2)} ms`);
            startNotify();
            logger.info(`start notifying...`);
        });
    } catch (e) {
        logger.error(e);
    }
}

startServer();

const cleanUp = () => {
    logger.info('Stopping the server...');

    telegramBot.stopPoling().then(() => {
        logger.info('telegramBotService is closed.');
    });

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