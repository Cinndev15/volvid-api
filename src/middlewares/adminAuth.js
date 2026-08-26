import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Token de administrador no proporcionado.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if the role is 'volvid_admin' and adminId is present
    if (decoded.role !== 'volvid_admin' || !decoded.adminId) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Permisos de administrador de Volvid requeridos.'
      });
    }

    // Attach admin payload to request object
    req.admin = {
      id: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
      adminRole: decoded.adminRole
    };

    next();
  } catch (error) {
    console.error('Admin JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Token de administrador inválido o expirado.'
    });
  }
};
