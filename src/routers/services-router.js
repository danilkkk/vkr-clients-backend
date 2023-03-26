import Router from 'express';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
import servicesController from "../controllers/services-controller.js";

const router = new Router();

const permissionMiddleware = createRoleMiddleware(Roles.SUPERUSER, Roles.ADMINISTRATOR, Roles.SELF_EMPLOYED_SPEC);

router.get('/', servicesController.getAllServices);

router.get('/:id', servicesController.getServiceById);

router.get('/:id/users', servicesController.getSpecialistsByService);

router.post('/create', permissionMiddleware, servicesController.createService);

router.delete('/:id', permissionMiddleware, servicesController.deleteService);

router.patch('/:id', permissionMiddleware, servicesController.editService);

export default router;