import {
  createPet,
  getPetsByOwner,
  reportLostPetService,
  markPetAsFoundService,
  getAllLostPetsService,
  getPetLostReportService
} from "../services/pet.service.js";

export const registerPet = async (req, res, next) => {
  try {
    const { name, type, breed_id, photo_url, age, fur_color, temperament, status, observations } = req.body;
    const ownerId = req.owner.id;

    const pet = await createPet(
      { name, type, breed_id, photo_url, age, fur_color, temperament, status, observations },
      ownerId
    );

    res.status(201).json({
      success: true,
      message: "Mascota registrada exitosamente.",
      data: pet
    });

  } catch (error) {
    if (error.message === "INVALID_BREED") {
      return res.status(400).json({
        success: false,
        message: "La raza seleccionada no es válida o no corresponde al tipo de mascota (perro/gato)."
      });
    }
    next(error);
  }
};

export const getMyPets = async (req, res, next) => {
  try {
    const ownerId = req.owner.id;
    const pets = await getPetsByOwner(ownerId);

    res.status(200).json({
      success: true,
      data: pets
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Report a pet as lost (creates/activates an amber alert)
 */
export const reportLostPet = async (req, res, next) => {
  try {
    const petId = req.params.id;
    const ownerId = req.owner.id;
    const { lost_location, lost_date, contact_phone, reward, notes } = req.body;

    const report = await reportLostPetService(
      petId,
      ownerId,
      { lost_location, lost_date, contact_phone, reward, notes }
    );

    res.status(201).json({
      success: true,
      message: "Alerta de mascota perdida registrada y activada exitosamente.",
      data: report
    });
  } catch (error) {
    if (error.message === "PET_NOT_FOUND_OR_UNAUTHORIZED") {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada o no pertenece al propietario autenticado."
      });
    }
    next(error);
  }
};

/**
 * Mark a pet as found (resolves active lost report)
 */
export const markPetAsFound = async (req, res, next) => {
  try {
    const petId = req.params.id;
    const ownerId = req.owner.id;

    const result = await markPetAsFoundService(petId, ownerId);

    res.status(200).json({
      success: true,
      message: "¡Excelente noticia! La mascota ha sido marcada como encontrada y la alerta SOS ha sido desactivada.",
      data: result
    });
  } catch (error) {
    if (error.message === "PET_NOT_FOUND_OR_UNAUTHORIZED") {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada o no pertenece al propietario autenticado."
      });
    }
    next(error);
  }
};

/**
 * Get all currently lost pets (Public / Community feed)
 */
export const getLostPets = async (req, res, next) => {
  try {
    const lostPets = await getAllLostPetsService();
    res.status(200).json({
      success: true,
      data: lostPets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active lost report for a specific pet
 */
export const getPetLostReport = async (req, res, next) => {
  try {
    const petId = req.params.id;
    const report = await getPetLostReportService(petId);

    if (!report) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "La mascota no tiene una alerta de pérdida activa."
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
