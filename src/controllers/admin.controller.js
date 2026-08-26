import {
  registerVolvidAdmin,
  authenticateVolvidAdmin,
  getVolvidAdminProfile,
  listVolvidAdmins,
  updateVolvidAdminStatus,
  listVolvidPetsAdmin,
  getVolvidPetDetailsAdmin,
  getVolvidPetQrAdmin,
  listVolvidOwnersAdmin,
  listVolvidClinicsAdmin,
  listVolvidVeterinariansAdmin,
  listVolvidServiceProvidersAdmin,
  getVolvidAdminDashboardStats
} from '../services/admin.service.js';

/**
 * Controller to register a new Volvid platform administrator
 */
export const registerAdmin = async (req, res, next) => {
  try {
    const { full_name, email, password, phone, role, avatar_url } = req.body;

    const admin = await registerVolvidAdmin({
      full_name,
      email,
      password,
      phone,
      role,
      avatar_url
    });

    res.status(201).json({
      success: true,
      message: 'Administrador de Volvid registrado exitosamente.',
      data: admin
    });
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado para un administrador.'
      });
    }
    next(error);
  }
};

/**
 * Controller to authenticate a Volvid platform administrator
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authenticateVolvidAdmin(email, password);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión de administrador exitoso.',
      data: {
        token: result.token,
        admin: result.admin
      }
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Correo electrónico o contraseña incorrectos.'
      });
    }
    if (error.message === 'ACCOUNT_INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de administrador se encuentra inactiva. Contacte al Superadministrador.'
      });
    }
    if (error.message === 'ACCOUNT_SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de administrador ha sido suspendida.'
      });
    }
    next(error);
  }
};

/**
 * Controller to get current authenticated administrator profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const admin = await getVolvidAdminProfile(req.admin.id);

    res.status(200).json({
      success: true,
      message: 'Perfil de administrador obtenido exitosamente.',
      data: admin
    });
  } catch (error) {
    if (error.message === 'ADMIN_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado.'
      });
    }
    next(error);
  }
};

/**
 * Controller to list all platform administrators
 */
export const listAdmins = async (req, res, next) => {
  try {
    const admins = await listVolvidAdmins();

    res.status(200).json({
      success: true,
      message: 'Lista de administradores obtenida exitosamente.',
      data: admins
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update administrator status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "El estado debe ser 'active', 'inactive' o 'suspended'."
      });
    }

    const updatedAdmin = await updateVolvidAdminStatus(id, status);

    res.status(200).json({
      success: true,
      message: `Estado del administrador actualizado a '${status}' exitosamente.`,
      data: updatedAdmin
    });
  } catch (error) {
    if (error.message === 'ADMIN_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado.'
      });
    }
    next(error);
  }
};

/**
 * Controller to list all registered pets for the administrator
 */
export const listPets = async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    const pets = await listVolvidPetsAdmin({ search, status, type });

    res.status(200).json({
      success: true,
      message: 'Catálogo de mascotas obtenido exitosamente.',
      count: pets.length,
      data: pets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get single pet details for administration
 */
export const getPetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pet = await getVolvidPetDetailsAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Detalles de la mascota obtenidos exitosamente.',
      data: pet
    });
  } catch (error) {
    if (error.message === 'PET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada.'
      });
    }
    next(error);
  }
};

/**
 * Controller to get or render pet QR Code
 */
export const getPetQr = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qrData = await getVolvidPetQrAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Código QR obtenido exitosamente.',
      data: qrData
    });
  } catch (error) {
    if (error.message === 'PET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada.'
      });
    }
    next(error);
  }
};

/**
 * Controller to list all registered pet owners (users)
 */
export const listOwners = async (req, res, next) => {
  try {
    const { search } = req.query;
    const owners = await listVolvidOwnersAdmin({ search });

    res.status(200).json({
      success: true,
      message: 'Lista de propietarios registrada obtenida exitosamente.',
      count: owners.length,
      data: owners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all registered veterinary clinics
 */
export const listClinics = async (req, res, next) => {
  try {
    const { search, status, city } = req.query;
    const clinics = await listVolvidClinicsAdmin({ search, status, city });

    res.status(200).json({
      success: true,
      message: 'Lista de clínicas veterinarias obtenida exitosamente.',
      count: clinics.length,
      data: clinics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all registered veterinarians
 */
export const listVeterinarians = async (req, res, next) => {
  try {
    const { search, clinic_id } = req.query;
    const vets = await listVolvidVeterinariansAdmin({ search, clinic_id });

    res.status(200).json({
      success: true,
      message: 'Lista de médicos veterinarios obtenida exitosamente.',
      count: vets.length,
      data: vets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all registered service providers (walkers / transporters)
 */
export const listServiceProviders = async (req, res, next) => {
  try {
    const { search, service_type, status } = req.query;
    const providers = await listVolvidServiceProvidersAdmin({ search, service_type, status });

    res.status(200).json({
      success: true,
      message: 'Lista de prestadores de servicio obtenida exitosamente.',
      count: providers.length,
      data: providers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get global dashboard metrics & stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const overview = await getVolvidAdminDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Métricas generales del panel de administración obtenidas exitosamente.',
      data: overview
    });
  } catch (error) {
    next(error);
  }
};
