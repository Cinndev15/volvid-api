import { Router } from 'express';
import authRoutes from './auth.routes.js';
import breedRoutes from './breed.routes.js';
import petRoutes from './pet.routes.js';
import clientRoutes from './client.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/breeds', breedRoutes);
router.use('/pets', petRoutes);
router.use('/clients', clientRoutes);

export default router;
