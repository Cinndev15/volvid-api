import {
  registerVolvidAdmin,
  authenticateVolvidAdmin,
  getVolvidAdminProfile,
  listVolvidAdmins,
  updateVolvidAdminStatus
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
