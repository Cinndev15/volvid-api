-- Tabla de Clínicas (Clinics) con soporte para prueba de 14 días
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  status ENUM('trial', 'active', 'suspended') DEFAULT 'trial',
  trial_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trial_end TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Usuarios (Administradores y Veterinarios)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(50) NULL,
  phone VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Tabla de Propietarios de Mascotas (Pet Owners)
CREATE TABLE IF NOT EXISTS pet_owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL, -- Nulo si el registro es federado con Google
  google_id VARCHAR(255) NULL UNIQUE, -- ID federado de Google
  avatar_url VARCHAR(500) NULL, -- Foto de perfil de Google
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Razas (Breeds)
CREATE TABLE IF NOT EXISTS breeds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('dog', 'cat') NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Semilla de Razas de Perros
INSERT INTO breeds (type, name) VALUES 
('dog', 'Golden Retriever'),
('dog', 'Pastor Alemán'),
('dog', 'French Bulldog'),
('dog', 'Beagle'),
('dog', 'Poodle'),
('dog', 'Labrador Retriever'),
('dog', 'Chihuahua'),
('dog', 'Boxer'),
('dog', 'Siberian Husky'),
('dog', 'Pug'),
('dog', 'Cocker Spaniel'),
('dog', 'Rottweiler'),
('dog', 'Yorkshire Terrier'),
('dog', 'Shih Tzu'),
('dog', 'Border Collie'),
('dog', 'Pomeranian'),
('dog', 'Dálmata'),
('dog', 'Dóberman'),
('dog', 'Pitbull'),
('dog', 'Schnauzer'),
('dog', 'Mestizo / Criollo')
ON DUPLICATE KEY UPDATE name=name;

-- Semilla de Razas de Gatos
INSERT INTO breeds (type, name) VALUES 
('cat', 'Persa'),
('cat', 'Maine Coon'),
('cat', 'Siamés'),
('cat', 'Bengala'),
('cat', 'Esfinge (Sphynx)'),
('cat', 'British Shorthair'),
('cat', 'Ragdoll'),
('cat', 'Abisinio'),
('cat', 'Sagrado de Birmania'),
('cat', 'Azul Ruso'),
('cat', 'Scottish Fold'),
('cat', 'American Shorthair'),
('cat', 'Birmano'),
('cat', 'Siberiano'),
('cat', 'Angora Turco'),
('cat', 'Bombay'),
('cat', 'Manx'),
('cat', 'Chartreux (Cartujo)'),
('cat', 'Mau Egipcio'),
('cat', 'Devon Rex'),
('cat', 'Mestizo / Criollo')
ON DUPLICATE KEY UPDATE name=name;

-- Tabla de Mascotas (Pets)
CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  breed_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('dog', 'cat') NOT NULL,
  photo_url VARCHAR(500) NULL, -- Almacena foto o avatar seleccionado
  age VARCHAR(100) NULL, -- Edad descriptiva (ej: "2 años, 6 meses")
  fur_color VARCHAR(100) NULL, -- Color de pelaje (ej: "Marrón")
  temperament VARCHAR(100) NULL, -- Temperamento (ej: "Tranquilo")
  status ENUM('active', 'inactive') DEFAULT 'active', -- Estado activo/inactivo
  observations TEXT NULL, -- Observaciones
  qr_code TEXT NULL, -- Código QR en base64 (data:image/png;base64,...)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE,
  FOREIGN KEY (breed_id) REFERENCES breeds(id)
);


-- Tabla de Vinculación de Pacientes por Veterinaria (Clinic Patients)
CREATE TABLE IF NOT EXISTS clinic_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  notes TEXT NULL,
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clinic_pet (clinic_id, pet_id),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE
);

-- Tabla de Veterinarios por Clínica (Veterinarians)
CREATE TABLE IF NOT EXISTS veterinarians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  user_id INT NULL,
  full_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(50) NULL,
  professional_card VARCHAR(50) NOT NULL,
  specialty VARCHAR(100) DEFAULT 'Medicina General',
  phone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Historias Clínicas con Consecutivo por Veterinaria (Medical Records)
CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  vet_id INT NOT NULL,
  consecutive_number INT NOT NULL,
  consecutive_code VARCHAR(50) NOT NULL,
  record_type ENUM('consultation', 'control', 'vaccination', 'deworming', 'surgery', 'emergency') DEFAULT 'consultation',
  reason TEXT NOT NULL,
  anamnesis TEXT NULL,
  weight_kg DECIMAL(5,2) NULL,
  temperature DECIMAL(4,2) NULL,
  heart_rate INT NULL,
  respiratory_rate INT NULL,
  mucosa_state VARCHAR(100) NULL,
  body_condition VARCHAR(50) NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL,
  prescription TEXT NULL,
  next_control_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clinic_consecutive (clinic_id, consecutive_number),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES veterinarians(id)
);


-- Tabla de Citas Médicas por Veterinaria (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  vet_id INT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  duration_minutes INT DEFAULT 30,
  motive VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  status ENUM('scheduled', 'waiting', 'in-progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES veterinarians(id) ON DELETE SET NULL
);


-- Tabla de Reportes de Mascotas Perdidas (Lost Pet Reports)
CREATE TABLE IF NOT EXISTS lost_pet_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
  lost_date DATE NOT NULL,
  lost_location VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  reward VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE
);

-- Tabla de Prestadores de Servicios (Service Providers: Paseadores / Transportadores)
CREATE TABLE IF NOT EXISTS service_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  document_type VARCHAR(50) NOT NULL DEFAULT 'Cédula de Ciudadanía',
  document_number VARCHAR(100) NOT NULL,
  service_type ENUM('walker', 'transporter', 'both') NOT NULL,
  city VARCHAR(100) NOT NULL,
  coverage_areas VARCHAR(255) NULL,
  experience_years INT DEFAULT 0,
  vehicle_type VARCHAR(100) NULL,
  vehicle_plate VARCHAR(50) NULL,
  bio_description TEXT NULL,
  hourly_rate DECIMAL(10,2) NULL,
  document_id_front_url LONGTEXT NULL,
  document_id_back_url LONGTEXT NULL,
  criminal_record_doc_url LONGTEXT NULL,
  driver_license_doc_url LONGTEXT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_email (email),
  INDEX idx_provider_service_type (service_type),
  INDEX idx_provider_status (status)
);

-- Tabla de Administradores de la Plataforma Volvid (Volvid Platform Admins)
CREATE TABLE IF NOT EXISTS volvid_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  role ENUM('superadmin', 'admin', 'support') DEFAULT 'superadmin',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  avatar_url VARCHAR(500) NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_volvid_admin_email (email),
  INDEX idx_volvid_admin_status (status)
);

