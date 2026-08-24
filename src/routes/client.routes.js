import { Router } from 'express';
import {
  searchClients,
  linkClient,
  getClinicClients,
  registerAndLink
} from '../controllers/client.controller.js';

const router = Router();

// GET /api/clients/search?query=...&clinic_id=...
router.get('/search', searchClients);

// POST /api/clients/link
router.post('/link', linkClient);

// GET /api/clients/clinic/:clinicId
router.get('/clinic/:clinicId', getClinicClients);

// POST /api/clients/register-and-link
router.post('/register-and-link', registerAndLink);

export default router;
