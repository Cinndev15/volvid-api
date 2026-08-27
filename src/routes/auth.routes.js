import { Router } from 'express';
import {
  register,
  login,
  registerOwner,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import {
  registerValidationRules,
  loginValidationRules,
  registerOwnerValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules
} from '../middlewares/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidationRules, register);

// POST /api/auth/login
router.post('/login', loginValidationRules, login);

// POST /api/auth/register-owner
router.post('/register-owner', registerOwnerValidationRules, registerOwner);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidationRules, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidationRules, resetPassword);

export default router;
