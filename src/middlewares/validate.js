import { body, validationResult } from 'express-validator';

// Middleware to handle validation result
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Los datos proporcionados no son válidos.',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation schema
export const registerValidationRules = [
  // Clinic steps fields
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la clínica es requerido.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('El teléfono de contacto es requerido.'),
  body('size')
    .trim()
    .notEmpty()
    .withMessage('El tamaño de la clínica (número de veterinarios) es requerido.'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('El país es requerido.'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('El departamento / estado es requerido.'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es requerida.'),
  
  // Administrator User fields
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo del administrador es requerido.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('terms_accepted')
    .isBoolean()
    .withMessage('El campo términos aceptados debe ser un valor booleano.')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Debe aceptar los términos y condiciones para continuar.');
      }
      return true;
    }),
  handleValidationErrors
];

// Login validation schema
export const loginValidationRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida.'),
  handleValidationErrors
];

// Pet Owner registration validation schema (handles form and Google)
export const registerOwnerValidationRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es requerido.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido.')
    .normalizeEmail(),
  body('google_id')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El google_id no puede estar vacío.'),
  body('avatar_url')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        throw new Error('El avatar_url debe ser una dirección URL válida.');
      }
      return true;
    }),
  body('password')
    .custom((value, { req }) => {
      // If registered with Google, password is not required
      if (req.body.google_id) {
        return true;
      }
      // Traditional registration requires password with at least 6 characters
      if (!value || value.trim().length < 6) {
        throw new Error('La contraseña es requerida y debe tener al menos 6 caracteres.');
      }
      return true;
    }),
  body('terms_accepted')
    .isBoolean()
    .withMessage('El campo términos aceptados debe ser un valor booleano.')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Debe aceptar los términos y condiciones para continuar.');
      }
      return true;
    }),
  handleValidationErrors
];
