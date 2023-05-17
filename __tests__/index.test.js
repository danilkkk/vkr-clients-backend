import request from "supertest";
import userModel from "../src/models/user-model.js";
import app from  "../src/app.js";
import dotenv from 'dotenv';
import mongoose from "mongoose";
import logger from "../src/logger.js";

const DATABASE_URI = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME || 'clients';

dotenv.config();

describe('Testing the overall functionality of the application', () => {
    beforeAll(() => {
         return mongoose.connect(DATABASE_URI, {
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
    });

    afterAll((done) => {
        return mongoose.connection.close(false, () => {
            logger.info('Connection to MongoDB is closed.');
            done();
        });
    });

    test('[/offices] It should response the GET method', done => {
        request(app)
            .get('/offices')
            .then(response => {
                expect(response.statusCode).toBe(200);
                done();
            });
    });

    test('[/services] It should response the GET method', done => {
        request(app)
            .get('/services')
            .then(response => {
                expect(response.statusCode).toBe(200);
                done();
            });
    });

    test('[/users] It should return an error with code 401: Not authorized', done => {
        request(app)
            .get('/users')
            .then(response => {
                expect(response.statusCode).toBe(401);
                done();
            });
    });

    it('It should insert the document into the collection and then delete it', async () => {
        const mockUser = { name: 'John', surname: 'Mayer' };

        const { _id } = await userModel.create(mockUser);

        const insertedUser = await userModel.findOne({_id }).exec();

        expect(insertedUser.name).toEqual(mockUser.name);
        expect(insertedUser.surname).toEqual(mockUser.surname);
        expect(insertedUser.isActivated).toEqual(false);
        expect(insertedUser.roles).toEqual([]);

        await insertedUser.delete();

        const deletedUser = await userModel.findOne({ _id }).exec();

        expect(deletedUser).toEqual(null);
    });
});