import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const ownerAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Token no proporcionado.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if the role is 'owner' and ownerId is present
    if (decoded.role !== 'owner' || !decoded.ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Permisos de propietario insuficientes.'
      });
    }

    // Attach owner payload to request object
    req.owner = {
      id: decoded.ownerId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Owner JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Token inválido o expirado.'
    });
  }
};
