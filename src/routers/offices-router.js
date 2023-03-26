import Router from 'express';
import officesController from '../controllers/offices-controller.js';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";

const router = new Router();

const createAndDeleteMiddleware = createRoleMiddleware(Roles.SUPERUSER);
const editMiddleware = createRoleMiddleware(Roles.SUPERUSER, Roles.ADMINISTRATOR);

router.get('/', officesController.getAllOffices);

router.get('/:id', officesController.getOfficeById);

router.get('/:officeId/users', officesController.getUsersByOffice);

router.post('/create', createAndDeleteMiddleware, officesController.createOffice);

router.delete('/:id', createAndDeleteMiddleware, officesController.deleteOffice);

router.patch('/:id', editMiddleware, officesController.editOffice);

export default router;