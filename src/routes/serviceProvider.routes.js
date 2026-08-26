import { Router } from 'express';
import {
  registerServiceProvider,
  getMyProviderStatus,
  listServiceProviders
} from '../controllers/serviceProvider.controller.js';
import { registerServiceProviderValidationRules } from '../middlewares/validate.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const router = Router();

// Optional owner auth middleware
const optionalOwnerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.ownerId) {
        req.owner = {
          id: decoded.ownerId,
          email: decoded.email
        };
      }
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

// POST /api/service-providers/register - Postulación como paseador / transportador
router.post('/register', optionalOwnerAuth, registerServiceProviderValidationRules, registerServiceProvider);

// GET /api/service-providers/my-status - Estado de la postulación
router.get('/my-status', optionalOwnerAuth, getMyProviderStatus);

// GET /api/service-providers - Listado de prestadores verificados
router.get('/', listServiceProviders);

export default router;
