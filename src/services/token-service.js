import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import tokenModel from '../models/token-model.js';

class TokenService {
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return {
            accessToken,
            refreshToken
        }
    }

    validateAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (e) {
            return null;
        }
    }

    validateRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (e) {
            return null;
        }
    }

    async saveToken(userId, refreshToken) {
        // TODO: механизм сохранения нескольких токенов (для входа с разных устройств)

        const existingToken = await tokenModel.findOne({ USER: userId }).exec();

        if (existingToken) {
            existingToken.refreshToken = refreshToken;
            await existingToken.save();
            return existingToken;
        }

        return await tokenModel.create({ user: userId, refreshToken });
    }

    async removeToken(refreshToken) {
        return await tokenModel.deleteOne({ refreshToken }).exec();
    }

    async findToken(refreshToken) {
        return await tokenModel.findOne({ refreshToken }).exec();
    }
}

export default new TokenService()