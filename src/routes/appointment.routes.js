import { Router } from 'express';
import {
  scheduleAppointment,
  getAppointments,
  changeStatus,
  removeAppointment
} from '../controllers/appointment.controller.js';

const router = Router();

// POST /api/appointments
router.post('/', scheduleAppointment);

// GET /api/appointments/clinic/:clinicId
router.get('/clinic/:clinicId', getAppointments);

// PUT /api/appointments/:id/status
router.put('/:id/status', changeStatus);

// DELETE /api/appointments/:id
router.delete('/:id', removeAppointment);

export default router;
