import { Router } from 'express';
import { register, login, registerOwner } from '../controllers/auth.controller.js';
import { registerValidationRules, loginValidationRules, registerOwnerValidationRules } from '../middlewares/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidationRules, register);

// POST /api/auth/login
router.post('/login', loginValidationRules, login);

// POST /api/auth/register-owner
router.post('/register-owner', registerOwnerValidationRules, registerOwner);

export default router;
