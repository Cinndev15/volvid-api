import * as serviceProviderService from '../services/serviceProvider.service.js';

export const registerServiceProvider = async (req, res, next) => {
  try {
    const userId = req.owner?.id || null;
    const providerData = req.body;

    const result = await serviceProviderService.registerProvider(providerData, userId);

    return res.status(201).json({
      success: true,
      message: 'Tu postulación como prestador de servicios Volvid ha sido registrada con éxito.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProviderStatus = async (req, res, next) => {
  try {
    const email = req.query.email || req.owner?.email;
    const userId = req.owner?.id || null;

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un correo o autenticarse para consultar el estado.'
      });
    }

    const status = await serviceProviderService.getProviderStatus(email, userId);

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

export const listServiceProviders = async (req, res, next) => {
  try {
    const { service_type, city } = req.query;
    const providers = await serviceProviderService.listApprovedProviders({ service_type, city });

    return res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
  }
};
