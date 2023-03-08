import usersService from '../services/users-service.js';
import dotenv from 'dotenv';
import { validationResult } from "express-validator";
import ApiError from "../exceptions/api-error.js";
import UserDto from "../dtos/user-dto.js";

dotenv.config();

class UserController {

    async registration(req, res, next) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка валидации', errors.array()))
            }

            const { name, surname, email, password } = req.body;
            const user = await usersService.registration(name, surname, email, password);

            res.cookie('refreshToken', user.refreshToken, {
                // 30 days
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                // secure: true,
            })

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await usersService.login(email, password);

            res.cookie('refreshToken', user.refreshToken, {
                // 30 days
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                // secure: true,
            })

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            await usersService.logout(refreshToken);

            res.clearCookie('refreshToken');

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async activate(req, res, next) {
        try {
            const link = req.params.link;
            await usersService.activate(link);
            return res.redirect(process.env.CLIENT_URL);
        } catch (e) {
            next(e);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const user = await usersService.refresh(refreshToken);

            res.cookie('refreshToken', user.refreshToken, {
                // 30 days
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                // secure: true,
            })

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async getUsers(req, res, next) {
        try {
            const userDocuments = await usersService.getUsers();

            return res.json(UserDto.ConvertMany(userDocuments));
        } catch (e) {
            next(e);
        }
    }
}

export default new UserController();