import Router from 'express';

import usersController from "../controllers/users-controller.js";

const router = new Router();

router.delete('/delete', usersController.getAllUsers /*.deleteById*/);

router.post('/create', usersController.getAllUsers /*.create*/);

router.patch('/edit/:id', usersController.editUserById /*.editUser*/);

router.get('/:id', usersController.getUserById);

router.get('/', usersController.getAllUsers);

export default router;