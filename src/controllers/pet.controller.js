import { createPet, getPetsByOwner } from '../services/pet.service.js';

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
      message: 'Mascota registrada exitosamente.',
      data: pet
    });

  } catch (error) {
    if (error.message === 'INVALID_BREED') {
      return res.status(400).json({
        success: false,
        message: 'La raza seleccionada no es válida o no corresponde al tipo de mascota (perro/gato).'
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
