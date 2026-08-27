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

// Forgot password validation schema
export const forgotPasswordValidationRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido.')
    .normalizeEmail(),
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

// Pet registration validation schema
export const registerPetValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la mascota es requerido.'),
  body('type')
    .trim()
    .isIn(['dog', 'cat'])
    .withMessage("El tipo de mascota es requerido y debe ser 'dog' o 'cat'."),
  body('breed_id')
    .isInt({ min: 1 })
    .withMessage('Debe seleccionar una raza válida.'),
  body('photo_url')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        // Allows simple local avatar filename values or relative paths too, let's relax it slightly for avatar image names, but warn if it is an invalid format. Let's just check length and trim.
        if (value.length === 0) {
          throw new Error('La foto de la mascota no puede estar vacía.');
        }
      }
      return true;
    }),
  body('age')
    .optional()
    .trim(),
  body('fur_color')
    .optional()
    .trim(),
  body('temperament')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage("El estado de la mascota debe ser 'active' o 'inactive'."),
  body('observations')
    .optional()
    .trim(),
  handleValidationErrors
];


// Lost Pet reporting validation schema
export const reportLostPetValidationRules = [
  body("lost_location")
    .trim()
    .notEmpty()
    .withMessage("El lugar donde se extravió la mascota es requerido."),
  body("lost_date")
    .optional()
    .trim(),
  body("contact_phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono o medio de contacto de emergencia es requerido."),
  body("reward")
    .optional()
    .trim(),
  body("notes")
    .optional()
    .trim(),
  handleValidationErrors
];

// Service Provider registration validation rules (Walker / Transporter)
export const registerServiceProviderValidationRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es requerido.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('El número de teléfono o celular es requerido.'),
  body('document_type')
    .optional()
    .trim(),
  body('document_number')
    .trim()
    .notEmpty()
    .withMessage('El número de documento de identidad es requerido.'),
  body('service_type')
    .trim()
    .isIn(['walker', 'transporter', 'both'])
    .withMessage("El tipo de servicio debe ser 'walker' (Paseador), 'transporter' (Transportador) o 'both' (Ambos)."),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad de operación es requerida.'),
  body('coverage_areas')
    .optional()
    .trim(),
  body('experience_years')
    .optional()
    .toInt(),
  body('vehicle_type')
    .optional()
    .trim(),
  body('vehicle_plate')
    .optional()
    .trim(),
  body('bio_description')
    .optional()
    .trim(),
  body('hourly_rate')
    .optional()
    .toFloat(),
  body('terms_accepted')
    .custom((value) => {
      if (value !== true && value !== 'true' && value !== 1 && value !== '1') {
        throw new Error('Debe aceptar los términos y condiciones de prestador de servicios.');
      }
      return true;
    }),
  handleValidationErrors
];

// Volvid Administrator registration validation rules
export const registerAdminValidationRules = [
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
  body('phone')
    .optional()
    .trim(),
  body('role')
    .optional()
    .trim()
    .isIn(['superadmin', 'admin', 'support'])
    .withMessage("El rol debe ser 'superadmin', 'admin' o 'support'."),
  body('avatar_url')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        throw new Error('El avatar_url debe ser una dirección URL válida.');
      }
      return true;
    }),
  handleValidationErrors
];

// Volvid Administrator login validation rules
export const loginAdminValidationRules = [
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

