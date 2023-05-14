import Router from 'express';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
import recordsController from "../controllers/records-controller.js";

const router = new Router();

const permissionMiddleware = createRoleMiddleware(Roles.SELF_EMPLOYED_SPEC, Roles.ADMINISTRATOR, Roles.SUPERUSER);
const permissionMiddlewareLight = createRoleMiddleware(Roles.EMPLOYEE);
const loggedInOnly = createRoleMiddleware(Roles.USER, Roles.EMPLOYEE);

router.post('/create', loggedInOnly, recordsController.createRecord);

router.get('/:specId/available', recordsController.getAvailableDaysForService);

router.get('/byUser', loggedInOnly, recordsController.getClientRecords);

router.get('/profit', permissionMiddlewareLight, recordsController.getProfitForPeriod);

router.get('/bySpec', permissionMiddlewareLight, recordsController.getRecordsBySpec);

router.delete('/:recordId/delete', loggedInOnly, recordsController.deleteRecordById);

router.patch('/:recordId/paid', permissionMiddleware, recordsController.setPaidStatus);

router.patch('/:recordId/edit', permissionMiddleware, recordsController.editRecordById);

export default router;