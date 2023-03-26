import Router from 'express';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
import schedulePatternsController from "../controllers/schedule-patterns-controller.js";

const router = new Router();

const permissionMiddleware = createRoleMiddleware(Roles.EMPLOYEE);

router.get('/', permissionMiddleware, schedulePatternsController.getAllPatternsByUser);

router.get('/:id', permissionMiddleware, schedulePatternsController.getPatternById);

router.post('/create', permissionMiddleware, schedulePatternsController.createPattern);

router.delete('/:id', permissionMiddleware, schedulePatternsController.deletePattern);

router.patch('/:id', permissionMiddleware, schedulePatternsController.renamePattern);

export default router;