import userModel from '../models/user-model.js';
import bcrypt from 'bcrypt';
import UserDto from '../dtos/user-dto.js';
import SpecialistDto from "../dtos/specialist-dto.js";
import UserModel from "../models/user-model.js";
import ApiError from "../exceptions/api-error.js";
import chunkedData from "../utils/chunked-data.js";
import dotenv from "dotenv";
import Roles from "../models/role-model.js";
import rolesService from "./roles-service.js";
import mailService from "./mail-service.js";
import { v4 } from "uuid";
import ServiceSpecialistModel from "../models/service-specialist-model.js";
import ServiceDto from "../dtos/service-dto.js";
import logger from "../logger.js";

dotenv.config();

const PASSWORD_SALT = Number(process.env.PASSWORD_SAULT || 5);

const SPECIALIST_ROLES = { roles: { $in: [Roles.SPECIALIST.name, Roles.SELF_EMPLOYED_SPEC.name]} };

class UsersService {
    constructor() {
        logger.info('[UsersService] initialization...');
    }

    itIsTheSameUser(userFrom, userTo) {
        return String(userFrom.id) === String(userTo.id);
    }

    async findUserByEmailOrPhoneOrTgId(email, phone, telegramId) {
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

        if (telegramId) {
            pipeline.$or.push({
                'telegramId': telegramId
            })
        }

        return await UserModel.findOne(pipeline).exec();
    }

    async registerUserFromMessenger(messenger, telegramId, name, surname) {
        const candidate = await this.getUserViaMessenger(messenger, telegramId);

        if (candidate) {
            return;
        }

        await userModel.create({ telegramId, telegramCode: v4(), name, surname, roles: [Roles.USER.name], isActivated: true });
    }

    async createUser(currentUser, name, surname, email, phone, roles = [Roles.UNREGISTERED.name], officeId) {
        const candidate = await this.findUserByEmailOrPhoneOrTgId(email, phone);

        if (candidate) {
            throw ApiError.BadRequest(`Email address or phone is already in use`);
        }

        rolesService.checkIfHasMorePriority(currentUser, roles);

        if (!roles.find(roleName => roleName === Roles.UNREGISTERED.name)) {
            roles.push(Roles.UNREGISTERED.name);
        }

        const userDocument = await userModel.create({ name, surname, email, phone, roles, officeId });

        return UserDto.Convert(userDocument);
    }

    async deleteUserById(currentUser, id) {
        const userDocument = await getUserDocumentById(id);

        rolesService.checkIfHasMorePriority(currentUser, userDocument.roles);

        await userDocument.delete();
    }

    async getSpecialistsByOffice(officeId) {
        const users = await userModel.find({ officeId, ...SPECIALIST_ROLES }).exec();
        return SpecialistDto.ConvertMany(users);
    }

    async getSpecialistsByService(serviceId) {
        const serviceSpecialist = await ServiceSpecialistModel.find({ serviceId }).populate('userId').exec();
        return SpecialistDto.ConvertMany(serviceSpecialist.map(ss => ss.userId));
    }

    async getServicesBySpecialist(userId) {
        const serviceSpecialist = await ServiceSpecialistModel.find({ userId }).populate('serviceId').exec();
        return ServiceDto.ConvertMany(serviceSpecialist.map(ss => ss.serviceId));
    }

    async addServiceToSpecialist(currentUser, userId, serviceId) {
        if (currentUser.roles.indexOf(Roles.SELF_EMPLOYED_SPEC.name) !== -1 && userId !== currentUser.id) {
            throw ApiError.AccessForbidden();
        }
        await ServiceSpecialistModel.create({ userId, serviceId });
    }

    async getAllUsers(from, count) {
        return await chunkedData(UserModel, UserDto.ConvertMany, 'users', [], from, count);
    }

    async searchUsers(query, from, count) {
        const searchPipeline = [{
            $match: {
                "$text": {
                    "$search": query,
                    "$caseSensitive": false,
                }
            }
        }];

        return await chunkedData(UserModel, UserDto.ConvertMany, 'users', searchPipeline, from, count);
    }

    async getUserById(id) {
        const userDocument = await getUserDocumentById(id);
        return UserDto.Convert(userDocument);
    }

    async getUserViaMessenger(_, telegramId) {
        const userDocument = await userModel.findOne({ telegramId }).exec();
        return UserDto.Convert(userDocument);
    }

    async editUserById(currentUser, id, changes) {
        const userDocument = await getUserDocumentById(id);

        const itIsTheSameUser = this.itIsTheSameUser(currentUser, UserDto.Convert(userDocument));

        if (!itIsTheSameUser) {
            rolesService.checkIfHasMorePriority(currentUser, userDocument.roles, Roles.SELF_EMPLOYED_SPEC);
        }

        const { name, surname, isActivated: isActivated0, email, phone, password: originalPassword, roles, officeId } = changes;

        let isActivated = isActivated0;
        let activationLink = userDocument.activationLink;

        if (email && email !== userDocument.email) {
            const candidate = await userModel.findOne({ email }).exec();

            if (candidate) {
                throw ApiError.BadRequest(`Email address ${email} is already in use`);
            }

            if (itIsTheSameUser) {
                isActivated = false;
                activationLink = v4();
                await mailService.sendActivationLink(email, name || userDocument.name, activationLink)
            }
        }

        if (phone && phone !== userDocument.phone) {
            const candidate = await userModel.findOne({ phone }).exec();

            if (candidate) {
                throw ApiError.BadRequest(`Phone number ${phone} is already in use`);
            }
        }

        const password = originalPassword ? await bcrypt.hash(originalPassword, PASSWORD_SALT) : userDocument.password;

        await userModel.findByIdAndUpdate(id, { name, surname, isActivated, email, phone, password, roles, activationLink, officeId }).exec();

        const newUserDocument = await getUserDocumentById(id);

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