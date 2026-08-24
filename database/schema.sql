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
