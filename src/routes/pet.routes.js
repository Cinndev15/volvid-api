import { Router } from 'express';
import { registerPet, getMyPets } from '../controllers/pet.controller.js';
import { ownerAuthMiddleware } from '../middlewares/ownerAuth.js';
import { registerPetValidationRules } from '../middlewares/validate.js';

const router = Router();

// POST /api/pets - Register a new pet (authenticated owner)
router.post('/', ownerAuthMiddleware, registerPetValidationRules, registerPet);

// GET /api/pets - List pets of authenticated owner
router.get('/', ownerAuthMiddleware, getMyPets);

export default router;
