import authService from '../services/auth-service.js';
import dotenv from 'dotenv';
import { validationResult } from "express-validator";
import ApiError from "../exceptions/api-error.js";

dotenv.config();

class AuthController {

    async sendResetPasswordLink(req, res, next) {
        try {
            const { email, phone, telegramId } = req.body;

            await authService.sendResetPasswordLink(email, phone, telegramId );

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { email, phone, telegramId, oldPassword, newPassword  } = req.body;

            await authService.changePassword(email, phone, telegramId, oldPassword, newPassword);

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async registration(req, res, next) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка валидации', errors.array()))
            }

            const { name, surname, email, telegramId, phone, password } = req.body;
            const user = await authService.registration(name, surname, email, telegramId, phone, password);

            saveRefreshTokenToCookie(res, user.refreshToken);

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {

            console.log('login');
            const { email, phone, password, telegramId } = req.body;

            if (password && (email || phone || telegramId)) {
                const user = await authService.login(email, phone, telegramId, password);

                saveRefreshTokenToCookie(res, user.refreshToken);

                return res.json(user);
            } else {
                next(ApiError.BadRequest());
            }
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            await authService.logout(refreshToken);

            res.clearCookie('refreshToken');

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async activate(req, res, next) {
        try {
            const link = req.params.link;
            await authService.activate(link);
            return res.redirect(process.env.CLIENT_URL);
        } catch (e) {
            next(e);
        }
    }

    async changePasswordByLink(req, res, next) {
        try {
            const link = req.params.link;
            const newPassword = req.body.password;
            await authService.changePasswordByLink(link, newPassword);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const user = await authService.refresh(refreshToken);

            saveRefreshTokenToCookie(res, user.refreshToken);

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }
}

function saveRefreshTokenToCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
        // 30 days
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        // secure: true,
    })
}

export default new AuthController();