import userModel from '../models/user-model.js';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import mailService from './mail-service.js';
import tokenService from './token-service.js';
import UserDto from '../dtos/user-dto.js';
import UserModel from "../models/user-model.js";
import ApiError from "../exceptions/api-error.js";
import Roles from "../models/role-model.js";
import chunkedData from "../utils/chunked-data.js";
import dotenv from "dotenv";

dotenv.config();

const PASSWORD_SALT = Number(process.env.PASSWORD_SAULT || 5);

class UsersService {

    async createUser(name, surname, email, roles) {
        const candidate = await userModel.findOne({ email }).exec();

        if (candidate) {
            throw ApiError.BadRequest(`Email address ${email} is already in use`);
        }
    }

    async getAllUsers(from, count) {
        return await chunkedData(UserModel, UserDto.ConvertMany, 'users', from, count);
    }

    async getUserById(id) {
        const userDocument = await userModel.findById(id).exec();

        if (!userDocument) {
            throw ApiError.NotFound(`User with id ${id} does not exist`);
        }

        return UserDto.Convert(userDocument);
    }

    async editUserById(id, changes) {
        const userDocument = await userModel.findById(id).exec();

        if (!userDocument) {
            throw ApiError.NotFound(`User with id ${id} does not exist`);
        }

        const { name, surname, isActivated, email, phone, password: originalPassword, roles } = changes;

        if (email) {
            const candidate = await userModel.findOne({ email }).exec();

            if (candidate) {
                throw ApiError.BadRequest(`Email address ${email} is already in use`);
            }
        }

        console.log(PASSWORD_SALT);

        const password = originalPassword ? await bcrypt.hash(originalPassword, PASSWORD_SALT) : undefined;

        await userModel.findByIdAndUpdate(id, { name, surname, isActivated, email, phone, password, roles }).exec();

        const newUserDocument = await userModel.findById(id).exec();

        return UserDto.Convert(newUserDocument);
    }
}

export default new UsersService()