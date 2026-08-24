import { Router } from 'express';
import { getBreeds } from '../controllers/breed.controller.js';

const router = Router();

// GET /api/breeds
router.get('/', getBreeds);

export default router;
