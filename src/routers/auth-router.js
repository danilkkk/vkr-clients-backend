import Router from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth-controller.js';

const router = new Router();

router.post('/registration',
    body('email').if(body('email').exists()).isEmail(),
    body('phone').if(body('phone').exists()).isMobilePhone('ru-RU'),
    body('password').isLength({ min: 6, max: 32}),
    authController.registration);

router.post('/login', authController.login);

router.post('/resetPassword', authController.resetPassword);

router.get('/logout', authController.logout);

router.get('/activate/:link', authController.activate);

router.patch('/resetPassword/:link', authController.changePasswordByLink);

router.get('/refresh', authController.refresh);

export default router;