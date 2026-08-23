import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { registerValidationRules, loginValidationRules } from '../middlewares/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidationRules, register);

// POST /api/auth/login
router.post('/login', loginValidationRules, login);

export default router;
