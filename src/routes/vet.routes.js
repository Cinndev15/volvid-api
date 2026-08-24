import { Router } from 'express';
import {
  getVets,
  registerVet,
  editVet,
  removeVet
} from '../controllers/vet.controller.js';

const router = Router();

// GET /api/vets/clinic/:clinicId
router.get('/clinic/:clinicId', getVets);

// POST /api/vets
router.post('/', registerVet);

// PUT /api/vets/:id
router.put('/:id', editVet);

// DELETE /api/vets/:id
router.delete('/:id', removeVet);

export default router;
