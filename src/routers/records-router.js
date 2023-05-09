import Router from 'express';
import createRoleMiddleware from "../middlewares/auth-middleware.js";
import Roles from "../models/role-model.js";
import recordsController from "../controllers/records-controller.js";

const router = new Router();

const permissionMiddleware = createRoleMiddleware(Roles.SELF_EMPLOYED_SPEC, Roles.ADMINISTRATOR, Roles.SUPERUSER);
const loggedInOnly = createRoleMiddleware(Roles.USER, Roles.EMPLOYEE);

router.post('/create', loggedInOnly, recordsController.createRecord);

router.get('/:specId/available', recordsController.getAvailableDaysForService);

router.get('/byUser', recordsController.getClientRecords);

router.get('/profit', recordsController.getProfitForPeriod);

router.get('/byUserAndSpec', recordsController.getClientRecordsBySpec);

router.delete('/:recordId/delete', permissionMiddleware, recordsController.deleteRecordById);

router.patch('/:recordId/paid', permissionMiddleware, recordsController.setPaidStatus);

router.patch('/:recordId/edit', permissionMiddleware, recordsController.editRecordById);

export default router;