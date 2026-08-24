import { Router } from 'express';
import {
  registerMedicalRecord,
  getPetHistory,
  getClinicRecords,
  getRecordDetails,
  getNextConsecutiveCode
} from '../controllers/medicalRecord.controller.js';

const router = Router();

// POST /api/medical-records
router.post('/', registerMedicalRecord);

// GET /api/medical-records/consecutive/:clinicId
router.get('/consecutive/:clinicId', getNextConsecutiveCode);

// GET /api/medical-records/pet/:petId
router.get('/pet/:petId', getPetHistory);

// GET /api/medical-records/clinic/:clinicId
router.get('/clinic/:clinicId', getClinicRecords);

// GET /api/medical-records/:id
router.get('/:id', getRecordDetails);

export default router;
