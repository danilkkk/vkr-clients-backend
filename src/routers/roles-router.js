import Router from 'express';
import rolesController from "../controllers/roles-controller.js";
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
const router = new Router();

router.get('/', /*createRoleMiddleware(Roles.USER, Roles.ADMINISTRATOR, Roles.SELF_EMPLOYED_SPEC),*/ rolesController.get);

export default router;