import {
  createMedicalRecord,
  getPetMedicalHistory,
  getClinicMedicalRecords,
  getMedicalRecordById,
  getNextConsecutive
} from '../services/medicalRecord.service.js';

export const registerMedicalRecord = async (req, res, next) => {
  try {
    const { clinic_id, pet_id, vet_id, reason, diagnosis, treatment } = req.body;
    if (!clinic_id || !pet_id || !vet_id || !reason || !diagnosis || !treatment) {
      return res.status(400).json({
        success: false,
        message: 'clinic_id, pet_id, vet_id, reason, diagnosis y treatment son campos obligatorios.'
      });
    }

    const record = await createMedicalRecord(req.body);
    res.status(201).json({
      success: true,
      message: `Historia clínica ${record.consecutive_code} registrada exitosamente.`,
      data: record
    });
  } catch (error) {
    if (error.message === 'PET_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }
    next(error);
  }
};

export const getPetHistory = async (req, res, next) => {
  try {
    const { petId } = req.params;
    if (!petId) {
      return res.status(400).json({ success: false, message: 'ID de mascota requerido' });
    }
    const history = await getPetMedicalHistory(parseInt(petId, 10));
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const getClinicRecords = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { search } = req.query;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'ID de clínica requerido' });
    }
    const records = await getClinicMedicalRecords(parseInt(clinicId, 10), search || '');
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getRecordDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await getMedicalRecordById(parseInt(id, 10));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Historia clínica no encontrada.' });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getNextConsecutiveCode = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'ID de clínica requerido' });
    }
    const result = await getNextConsecutive(parseInt(clinicId, 10));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
