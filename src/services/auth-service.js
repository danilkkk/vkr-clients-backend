import userModel from '../models/user-model.js';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import mailService from './mail-service.js';
import tokenService from './token-service.js';
import UserDto from '../dtos/user-dto.js';
import UserModel from "../models/user-model.js";
import ApiError from "../exceptions/api-error.js";
import Roles from "../models/role-model.js";
import dotenv from "dotenv";
import usersService from "./users-service.js";

dotenv.config();

const PASSWORD_SALT = Number(process.env.PASSWORD_SAULT || 5);

class AuthService {
    async resetPassword(email) {
        const userDocument = await userModel.findOne({ email }).exec();

        if (!userDocument) {
            throw ApiError.BadRequest(`User with email ${email} does not exist`);
        }

        const resetPasswordLink = v4();

        userDocument.resetPasswordLink = resetPasswordLink;

        await mailService.sendResetPasswordLink(email, userDocument.name, `${process.env.CLIENT_URL}/reset/${resetPasswordLink}`);

        await userDocument.save();
    }

    async registration(name, surname, email, phone, originalPassword) {
        const candidate = await usersService.findUserByEmailOrPhone(email, phone);

        const unregistered = candidate && candidate.roles && candidate.roles.includes(Roles.UNREGISTERED.name);

        if (candidate && !unregistered) {
            throw ApiError.BadRequest(`Email address ${email} is already in use`);
        }

        const password = await bcrypt.hash(originalPassword, PASSWORD_SALT);

        const activationLink = v4();

        let userDocument;

        if (unregistered) {
            candidate.password = password;
            candidate.activationLink = activationLink;
            if (!candidate.roles.includes(Roles.USER.name)) {
                candidate.roles.push(Roles.USER.name);
            }
            candidate.roles = candidate.roles.filter(r => r !== Roles.UNREGISTERED.name);
            await candidate.save();
            userDocument = candidate;
        } else {
            userDocument = await userModel.create({ name, surname, email, phone, password, activationLink, roles: [Roles.USER.name] });
        }

        await mailService.sendActivationLink(email, name, `${process.env.API_URL}/auth/activate/${activationLink}`);

        return await getUserWithTokens(userDocument)
    }

    async login(email, phone, password) {
        const userDocument = await usersService.findUserByEmailOrPhone(email, phone);

        if (!userDocument) {
            throw ApiError.BadRequest(`A user with an email ${email} not found`)
        }

        const isPassEquals = await bcrypt.compare(password, userDocument.password);

        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }

        return await getUserWithTokens(userDocument);
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

    async changePasswordByLink(resetPasswordLink, newPassword) {
        const user = await UserModel.findOne({ resetPasswordLink }).exec();

        if (!user) {
            throw ApiError.BadRequest('Invalid reset link');
        }

        user.resetPasswordLink = null;
        user.password = await bcrypt.hash(newPassword, PASSWORD_SALT);
        await user.save();
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

export default new AuthService()