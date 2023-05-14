import Router from 'express';

import usersController from "../controllers/users-controller.js";
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";

const router = new Router();

const accessMiddleware = createRoleMiddleware(Roles.SELF_EMPLOYED_SPEC, Roles.ADMINISTRATOR, Roles.SUPERUSER);

router.post('/create', accessMiddleware, usersController.createUser);

router.get('/', accessMiddleware, usersController.getAllUsers);

router.get('/search', accessMiddleware, usersController.searchForUsers);

router.post('/:userId/addService', accessMiddleware, usersController.addServiceToSpecialist);

router.get('/:id', createRoleMiddleware(Roles.USER), usersController.getUserById);

router.get('/:id/services', usersController.getServicesBySpecialist);

router.patch('/:id/edit', accessMiddleware, usersController.editUserById);

router.delete('/:id/delete', accessMiddleware, usersController.deleteUserById);

export default router;