import {
  getClinicVets,
  createVet,
  updateVet,
  deleteVet
} from '../services/vet.service.js';

export const getVets = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'ID de clínica requerido' });
    }
    const vets = await getClinicVets(parseInt(clinicId, 10));
    res.status(200).json({ success: true, data: vets });
  } catch (error) {
    next(error);
  }
};

export const registerVet = async (req, res, next) => {
  try {
    const { clinic_id, full_name, professional_card, specialty, phone, email, document_number } = req.body;
    if (!clinic_id || !full_name || !professional_card) {
      return res.status(400).json({
        success: false,
        message: 'clinic_id, full_name y professional_card son obligatorios.'
      });
    }
    const vet = await createVet(parseInt(clinic_id, 10), {
      full_name,
      document_number,
      professional_card,
      specialty,
      phone,
      email
    });
    res.status(201).json({
      success: true,
      message: 'Veterinario registrado exitosamente en la clínica.',
      data: vet
    });
  } catch (error) {
    next(error);
  }
};

export const editVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.body;
    if (!id || !clinic_id) {
      return res.status(400).json({ success: false, message: 'ID de veterinario y clinic_id requeridos' });
    }
    const updated = await updateVet(parseInt(id, 10), parseInt(clinic_id, 10), req.body);
    res.status(200).json({ success: true, message: 'Veterinario actualizado.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const removeVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.query;
    if (!id || !clinic_id) {
      return res.status(400).json({ success: false, message: 'ID de veterinario y clinic_id requeridos' });
    }
    const result = await deleteVet(parseInt(id, 10), parseInt(clinic_id, 10));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
