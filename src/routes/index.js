import { Router } from 'express';
import authRoutes from './auth.routes.js';
import breedRoutes from './breed.routes.js';
import petRoutes from './pet.routes.js';
import clientRoutes from './client.routes.js';
import vetRoutes from './vet.routes.js';
import medicalRecordRoutes from './medicalRecord.routes.js';
import appointmentRoutes from './appointment.routes.js';
import serviceProviderRoutes from './serviceProvider.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/admin', adminRoutes);
router.use('/breeds', breedRoutes);
router.use('/pets', petRoutes);
router.use('/clients', clientRoutes);
router.use('/vets', vetRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/service-providers', serviceProviderRoutes);

export default router;

