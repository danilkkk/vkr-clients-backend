import Router from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth-controller.js';

const router = new Router();

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({ min: 5, max: 32}),
    authController.registration);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get('/activate/:link', authController.activate);

router.get('/refresh', authController.refresh);

export default router;