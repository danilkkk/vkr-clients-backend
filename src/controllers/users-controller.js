import usersService from "../services/users-service.js";

class UsersController {

    async getAllUsers(req, res, next) {
        try {
            const { from, count } = req.query;

            const users = await usersService.getAllUsers(Number(from), Number(count));

            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async searchForUsers(req, res, next) {
        try {
            console.log('searchForUsers');
            const { query } = req.query;

            console.log(query);

            const users = await usersService.searchUsers(query);

            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async addServiceToSpecialist(req, res, next) {
        try {
            const { userId } = req.params;
            const { serviceId } = req.body;

            const currentUser = res.getCurrentUser();

            await usersService.addServiceToSpecialist(currentUser, userId, serviceId);

            return res.send();
        } catch (e) {
            next(e);
        }
    }

    async getServicesBySpecialist(req, res, next) {
        try {
            const { id } = req.params;

            const services = await usersService.getServicesBySpecialist(id);

            return res.json(services);
        } catch (e) {
            next(e);
        }
    }

    async createUser(req, res, next) {
        try {
            const { name, surname, email, phone, roles, officeId } = req.body;

            const currentUser = res.getCurrentUser();

            const users = await usersService.createUser(currentUser, name, surname, email, phone, roles, officeId);

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