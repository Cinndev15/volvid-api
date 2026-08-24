import { registerClinicAndAdmin, authenticateUser } from '../services/auth.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { registerOrLoginOwner } from '../services/owner.service.js';

export const register = async (req, res, next) => {
  try {
    const {
      name, phone, size, country, state, city,
      full_name, email, password, terms_accepted
    } = req.body;

    const clinicData = { name, phone, size, country, state, city };
    const userData = { full_name, email, password, terms_accepted };

    const result = await registerClinicAndAdmin(clinicData, userData);

    res.status(201).json({
      success: true,
      message: 'Clínica registrada exitosamente. Comience su prueba de 14 días.',
      data: {
        clinic_id: result.clinic.id,
        clinic_name: result.clinic.name,
        user_email: result.user.email,
        user_name: result.user.full_name,
        trial_start: result.clinic.trial_start,
        trial_end: result.clinic.trial_end
      }
    });

    // Send welcome email asynchronously to not block the registration response
    sendWelcomeEmail(
      result.user.email,
      result.user.full_name,
      result.clinic.name,
      result.clinic.trial_end
    ).catch((err) => {
      console.error('Failed to send welcome email asynchronously:', err.message);
    });

  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado.'
      });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authenticateUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        token: result.token,
        user: result.user,
        clinic: result.clinic
      }
    });

  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Correo electrónico o contraseña incorrectos.'
      });
    }
    next(error);
  }
};

export const registerOwner = async (req, res, next) => {
  try {
    const { full_name, email, password, google_id, avatar_url, terms_accepted } = req.body;

    const result = await registerOrLoginOwner({
      full_name,
      email,
      password,
      google_id,
      avatar_url,
      terms_accepted
    });

    res.status(201).json({
      success: true,
      message: google_id 
        ? 'Inicio de sesión con Google exitoso.' 
        : 'Propietario registrado exitosamente.',
      data: {
        token: result.token,
        owner: result.owner
      }
    });

  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado.'
      });
    }
    if (error.message === 'EMAIL_EXISTS_WITH_OTHER_METHOD') {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado con otro método de inicio de sesión.'
      });
    }
    next(error);
  }
};
