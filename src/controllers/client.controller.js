import {
  searchOwnerAndPets,
  linkPetToClinic,
  getClinicPatients,
  registerAndLinkClient
} from '../services/client.service.js';

export const searchClients = async (req, res, next) => {
  try {
    const { query, clinic_id } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const results = await searchOwnerAndPets(query, clinic_id ? parseInt(clinic_id, 10) : null);

    res.status(200).json({
      success: true,
      message: results.length > 0 ? 'Resultados encontrados.' : 'No se encontraron propietarios ni mascotas con los criterios indicados.',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const linkClient = async (req, res, next) => {
  try {
    const { clinic_id, pet_id, notes } = req.body;

    if (!clinic_id || !pet_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren clinic_id y pet_id para vincular el paciente.'
      });
    }

    const linkedPatient = await linkPetToClinic(parseInt(clinic_id, 10), parseInt(pet_id, 10), notes);

    res.status(200).json({
      success: true,
      message: 'Paciente vinculado exitosamente a su veterinaria.',
      data: linkedPatient
    });
  } catch (error) {
    if (error.message === 'PET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'La mascota especificada no existe en el sistema.'
      });
    }
    next(error);
  }
};

export const getClinicClients = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { search } = req.query;

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: 'ID de clínica requerido.'
      });
    }

    const patients = await getClinicPatients(parseInt(clinicId, 10), search || '');

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

export const registerAndLink = async (req, res, next) => {
  try {
    const { clinic_id, owner, pet } = req.body;

    if (!clinic_id || !owner || !owner.full_name || !pet || !pet.name) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios para registrar y vincular al cliente.'
      });
    }

    const result = await registerAndLinkClient(parseInt(clinic_id, 10), owner, pet);

    res.status(201).json({
      success: true,
      message: 'Propietario y mascota registrados y vinculados exitosamente a su veterinaria.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
