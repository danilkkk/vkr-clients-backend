import userModel from '../models/user-model.js';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import mailService from './mail-service.js';
import tokenService from './token-service.js';
import UserDto from '../dtos/user-dto.js';
import UserModel from "../models/user-model.js";
import ApiError from "../exceptions/api-error.js";

const PASSWORD_SALT = 5;

class UsersService {

    async registration(name, surname, email, originalPassword) {
        const candidate = await userModel.findOne({ email }).exec();

        if (candidate) {
            throw ApiError.BadRequest(`Email address ${email} is already in use`);
        }

        const password = await bcrypt.hash(originalPassword, PASSWORD_SALT);

        const activationLink = v4();

        const userDocument = await userModel.create({ name, surname, email, password, activationLink });

        await mailService.sendActivationLink(email, name, `${process.env.API_URL}/users/activate/${activationLink}`);

        return await getUserWithTokens(userDocument)
    }

    async login(email, password) {
        const userDocument = await UserModel.findOne({ email }).exec();

        if (!userDocument) {
            throw ApiError.BadRequest(`A user with an email ${email} not found`)
        }

        const isPassEquals = await bcrypt.compare(password, userDocument.password);

        if (!isPassEquals) {
            return ApiError.BadRequest('Неверный пароль');
        }

        return await getUserWithTokens(userDocument)
    }

    async logout(refreshToken) {
        return await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);

        if (!userData) {
            throw ApiError.UnauthorizedError();
        }

        const tokenDocument = await tokenService.findToken(refreshToken);

        if (!tokenDocument) {
            throw ApiError.UnauthorizedError();
        }

        const userDocument = await UserModel.findById(userData.id).exec();

        return await getUserWithTokens(userDocument)
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({ activationLink }).exec();

        if (!user) {
            throw ApiError.BadRequest('Invalid activation link');
        }

        user.isActivated = true;
        user.activationLink = null;
        await user.save();
    }

    async getUsers() {
        return await UserModel.find().exec();
    }
}

async function getUserWithTokens(userDocument) {
    const user = new UserDto(userDocument);

    const { refreshToken, accessToken } = tokenService.generateTokens({ ...user });

    await tokenService.saveToken(user.id, refreshToken);

    return {
        refreshToken,
        accessToken,
        user
    }
}

export default new UsersService()