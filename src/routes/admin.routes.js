import { Router } from 'express';
import {
  registerAdmin,
  loginAdmin,
  getProfile,
  listAdmins,
  updateStatus,
  listPets,
  getPetDetails,
  getPetQr,
  listOwners,
  listClinics,
  listVeterinarians,
  listServiceProviders,
  getDashboardStats
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

// Management routes for Volvid Platform Admins
router.get('/pets', adminAuthMiddleware, listPets);
router.get('/pets/:id', adminAuthMiddleware, getPetDetails);
router.get('/pets/:id/qr', adminAuthMiddleware, getPetQr);

router.get('/owners', adminAuthMiddleware, listOwners);
router.get('/users', adminAuthMiddleware, listOwners);

router.get('/clinics', adminAuthMiddleware, listClinics);
router.get('/veterinarians', adminAuthMiddleware, listVeterinarians);
router.get('/vets', adminAuthMiddleware, listVeterinarians);

router.get('/service-providers', adminAuthMiddleware, listServiceProviders);

router.get('/stats', adminAuthMiddleware, getDashboardStats);
router.get('/overview', adminAuthMiddleware, getDashboardStats);

export default router;
