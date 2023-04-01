import Router from 'express';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
import scheduleController from "../controllers/schedule-controller.js";
import recordsController from "../controllers/records-controller.js";

const router = new Router();

const permissionMiddleware = createRoleMiddleware(Roles.SELF_EMPLOYED_SPEC, Roles.ADMINISTRATOR, Roles.SUPERUSER);
const loggedInOnly = createRoleMiddleware(Roles.USER, Roles.EMPLOYEE);

// router.get('/', permissionMiddleware, scheduleController.getUserSchedule);

router.post('/create', loggedInOnly, recordsController.createRecord);

router.get('/:userId/available', recordsController.getAvailableDaysForService);

router.post('/create', permissionMiddleware, scheduleController.createScheduleOnDay);

router.post('/createMany', permissionMiddleware, scheduleController.createScheduleOnDays);

router.delete('/:id/delete', permissionMiddleware, scheduleController.deleteScheduleOnDate);

router.patch('/:id/edit', permissionMiddleware, scheduleController.changePattern);

export default router;