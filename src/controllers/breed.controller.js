import { getBreedsByType } from '../services/breed.service.js';

export const getBreeds = async (req, res, next) => {
  try {
    const { type } = req.query;

    if (!type || (type !== 'dog' && type !== 'cat')) {
      return res.status(400).json({
        success: false,
        message: "Debe proveer un parámetro 'type' válido. Los valores aceptados son 'dog' o 'cat'."
      });
    }

    const breeds = await getBreedsByType(type);

    res.status(200).json({
      success: true,
      data: breeds
    });

  } catch (error) {
    next(error);
  }
};
