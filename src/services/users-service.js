import userModel from '../models/user-model.js';
import bcrypt from 'bcrypt';
import UserDto from '../dtos/user-dto.js';
import UserModel from "../models/user-model.js";
import ApiError from "../exceptions/api-error.js";
import chunkedData from "../utils/chunked-data.js";
import dotenv from "dotenv";
import Roles from "../models/role-model.js";
import rolesService from "./roles-service.js";

dotenv.config();

const PASSWORD_SALT = Number(process.env.PASSWORD_SAULT || 5);

class UsersService {

    async findUserByEmailOrPhone(email, phone) {
        const pipeline = {
            $or: []
        }

        if (email) {
            pipeline.$or.push({
                'email': email
            })
        }

        if (phone) {
            pipeline.$or.push({
                'phone': phone
            })
        }

        return await UserModel.findOne(pipeline).exec();
    }

    async createUser(currentUser, name, surname, email, phone, roles = [Roles.UNREGISTERED.name]) {
        const candidate = await this.findUserByEmailOrPhone(email, phone);

        if (candidate) {
            throw ApiError.BadRequest(`Email address or phone is already in use`);
        }

        rolesService.hasMorePriority(currentUser, roles);

        if (!roles.find(roleName => roleName === Roles.UNREGISTERED.name)) {
            roles.push(Roles.UNREGISTERED.name);
        }

        const userDocument = await userModel.create({ name, surname, email, phone, roles });

        return UserDto.Convert(userDocument);
    }

    async deleteUserById(currentUser, id) {
        const userDocument = await getUserDocumentById(id);

        rolesService.hasMorePriority(currentUser, userDocument.roles);

        await userDocument.delete();
    }

    async getAllUsers(from, count) {
        return await chunkedData(UserModel, UserDto.ConvertMany, 'users', from, count);
    }

    async getUserById(id) {
        const userDocument = await getUserDocumentById(id);
        return UserDto.Convert(userDocument);
    }

    async editUserById(currentUser, id, changes) {
        const userDocument = await getUserDocumentById(id);

        rolesService.hasMorePriority(currentUser, userDocument.roles);

        const { name, surname, isActivated, email, phone, password: originalPassword, roles } = changes;

        if (email) {
            const candidate = await userModel.findOne({ email }).exec();

            if (candidate) {
                throw ApiError.BadRequest(`Email address ${email} is already in use`);
            }
        }

        const password = originalPassword ? await bcrypt.hash(originalPassword, PASSWORD_SALT) : undefined;

        await userModel.findByIdAndUpdate(id, { name, surname, isActivated, email, phone, password, roles }).exec();

        const newUserDocument = await userModel.findById(id).exec();

        return UserDto.Convert(newUserDocument);
    }
}

async function getUserDocumentById(id) {
    const userDocument = await getUserDocumentByIdSafe(id);

    if (!userDocument) {
        throw ApiError.NotFound(`User with id ${id} does not exist`);
    }

    return userDocument;
}

async function getUserDocumentByIdSafe(id) {
    return await userModel.findById(id).exec();
}

export default new UsersService()