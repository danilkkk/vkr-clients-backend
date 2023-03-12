import dotenv from 'dotenv';
import ApiError from "../exceptions/api-error.js";
import usersService from "../services/users-service.js";

dotenv.config();

class UsersController {

    async getAllUsers(req, res, next) {
        try {

            const currentUser = res.getCurrentUser();

            const { from, count } = req.query;
            const users = await usersService.getAllUsers(Number(from), Number(count));

            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async createUser(req, res, next) {
        try {
            const { name, surname, email, phone, roles } = req.body;

            const currentUser = res.getCurrentUser();

            const users = await usersService.createUser(currentUser, name, surname, email, phone, roles);

            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await usersService.getUserById(id);

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async deleteUserById(req, res, next) {
        try {
            const { id } = req.params;
            const currentUser = res.getCurrentUser();
             await usersService.deleteUserById(currentUser, id);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async editUserById(req, res, next) {
        try {
            const { id } = req.params;
            const changes = req.body;
            const currentUser = res.getCurrentUser();
            const user = await usersService.editUserById(currentUser, id, changes);

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }
}

export default new UsersController();