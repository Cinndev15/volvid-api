import { Router } from 'express';
import {
  registerAdmin,
  loginAdmin,
  getProfile,
  listAdmins,
  updateStatus
} from '../controllers/admin.controller.js';
import {
  registerAdminValidationRules,
  loginAdminValidationRules
} from '../middlewares/validate.js';
import { adminAuthMiddleware } from '../middlewares/adminAuth.js';

const router = Router();

// Public routes for Volvid Platform Admins
router.post('/register', registerAdminValidationRules, registerAdmin);
router.post('/login', loginAdminValidationRules, loginAdmin);

// Protected routes (Requires Bearer Token with role 'volvid_admin')
router.get('/profile', adminAuthMiddleware, getProfile);
router.get('/', adminAuthMiddleware, listAdmins);
router.put('/:id/status', adminAuthMiddleware, updateStatus);

export default router;
