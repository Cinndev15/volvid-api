import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Load Swagger document dynamically to ensure compatibility across Node.js versions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'swagger.json'), 'utf8')
);

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Base Route - Professional HTML API Landing Portal themed in Volvid branding
app.get('/', (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Portal de documentación de la API de Volvid. Administre clínicas veterinarias y sus pruebas gratuitas de 14 días.">
  <title>Volvid REST API Portal</title>
  <!-- Google Fonts: Inter & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg-gradient-start: #ffffff;
      --bg-gradient-end: #f9fafb;
      --card-bg: #ffffff;
      --card-border: rgba(19, 44, 37, 0.08);
      --text-primary: #132c25; /* Deep forest green */
      --text-secondary: #475569; /* Slate grey */
      --primary-green: #00d97e; /* Vibrant Volvid green */
      --hover-green: #00b86a;
      --deep-forest: #132c25;
      --code-bg: #f8fafc;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1.5rem;
    }

    /* System Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: rgba(0, 217, 126, 0.08);
      border: 1px solid rgba(0, 217, 126, 0.25);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #047857;
      margin-bottom: 2rem;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--primary-green);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(0, 217, 126, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 217, 126, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(0, 217, 126, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 217, 126, 0);
      }
    }

    /* Main Branding */
    header {
      text-align: center;
      margin-bottom: 3.5rem;
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #132c25 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 600px;
      line-height: 1.6;
    }

    /* Grid Row Cards */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.5rem;
      width: 100%;
      max-width: 1000px;
      margin-bottom: 3rem;
    }

    @media (min-width: 768px) {
      .info-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    .info-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(19, 44, 37, 0.04);
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .info-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 217, 126, 0.35);
      box-shadow: 0 12px 30px -5px rgba(19, 44, 37, 0.08);
    }

    .card-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #047857;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-size: 1.25rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .copy-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: color 0.2s, background-color 0.2s;
    }

    .copy-btn:hover {
      color: var(--primary-green);
      background-color: rgba(0, 217, 126, 0.08);
    }

    .copy-icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    /* Core Endpoints Panel */
    .endpoints-panel {
      width: 100%;
      max-width: 1000px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow: 0 20px 40px -15px rgba(19, 44, 37, 0.06);
      margin-bottom: 2rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(19, 44, 37, 0.06);
      padding-bottom: 1rem;
    }

    .panel-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .format-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background-color: rgba(71, 85, 105, 0.04);
      border: 1px solid rgba(71, 85, 105, 0.1);
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      color: var(--text-secondary);
    }

    /* Table styles */
    .table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(19, 44, 37, 0.08);
    }

    td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(19, 44, 37, 0.05);
      font-size: 0.9rem;
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .method-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }

    .method-badge.post {
      background-color: rgba(0, 217, 126, 0.08);
      color: #047857;
      border: 1px solid rgba(0, 217, 126, 0.2);
    }

    .endpoint-path {
      font-family: monospace;
      font-size: 0.95rem;
      color: #047857;
      font-weight: 600;
    }

    .endpoint-desc {
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .security-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background-color: rgba(71, 85, 105, 0.05);
      color: #475569;
      border: 1px solid rgba(71, 85, 105, 0.12);
    }

    /* CTA Section */
    .cta-container {
      display: flex;
      justify-content: center;
      margin-top: 1rem;
    }

    .swagger-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--primary-green);
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      padding: 0.85rem 2rem;
      border-radius: 0.75rem;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(0, 217, 126, 0.3);
      transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
    }

    .swagger-btn:hover {
      background-color: var(--hover-green);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 217, 126, 0.4);
    }

    .swagger-btn:active {
      transform: translateY(0);
    }

    footer {
      margin-top: auto;
      padding-top: 3rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Status Badge -->
  <div class="status-badge">
    <div class="pulse-dot"></div>
    SYSTEM OPERATIONAL
  </div>

  <!-- Header -->
  <header>
    <h1>VÖLVÏD API</h1>
    <p class="subtitle">Portal Profesional de Documentación de la API REST de Volvid. Administre clínicas veterinarias y los accesos para la prueba gratuita de 14 días.</p>
  </header>

  <!-- Info Grid Cards -->
  <div class="info-grid">
    <!-- Card 1: Base URL -->
    <div class="info-card">
      <div class="card-label">Base URL</div>
      <div class="card-value">
        <span id="base-url-text">${baseUrl}</span>
        <button class="copy-btn" id="copy-url-btn" title="Copiar URL al portapapeles" onclick="copyToClipboard('${baseUrl}', 'copy-url-btn')">
          <svg class="copy-icon" viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Card 2: Version -->
    <div class="info-card">
      <div class="card-label">Version</div>
      <div class="card-value">1.0.0 (Latest)</div>
    </div>

    <!-- Card 3: Authentication -->
    <div class="info-card">
      <div class="card-label">Authentication</div>
      <div class="card-value">JWT Bearer Token</div>
    </div>
  </div>

  <!-- Endpoints Panel -->
  <div class="endpoints-panel">
    <div class="panel-header">
      <div class="panel-title">Core API Endpoints</div>
      <div class="format-badge">Format: JSON</div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
            <th>Security</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method-badge post">POST</span></td>
            <td><span class="endpoint-path">/api/auth/register</span></td>
            <td><span class="endpoint-desc">Registra una nueva veterinaria y su usuario administrador. Activa la prueba de 14 días.</span></td>
            <td><span class="security-badge">PUBLIC</span></td>
          </tr>
          <tr>
            <td><span class="method-badge post">POST</span></td>
            <td><span class="endpoint-path">/api/auth/login</span></td>
            <td><span class="endpoint-desc">Inicia sesión y genera un Bearer JWT token, devolviendo la fecha de expiración de la prueba.</span></td>
            <td><span class="security-badge">PUBLIC</span></td>
          </tr>
          <tr>
            <td><span class="method-badge post">POST</span></td>
            <td><span class="endpoint-path">/api/auth/register-owner</span></td>
            <td><span class="endpoint-desc">Registra o inicia sesión a un propietario de mascotas (formulario tradicional o Google OAuth).</span></td>
            <td><span class="security-badge">PUBLIC</span></td>
          </tr>
          <tr>
            <td><span class="method-badge post" style="background-color: rgba(59, 130, 246, 0.08); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.2);">GET</span></td>
            <td><span class="endpoint-path">/api/breeds</span></td>
            <td><span class="endpoint-desc">Consulta el catálogo de razas de perros o gatos filtradas por tipo.</span></td>
            <td><span class="security-badge">PUBLIC</span></td>
          </tr>
          <tr>
            <td><span class="method-badge post">POST</span></td>
            <td><span class="endpoint-path">/api/pets</span></td>
            <td><span class="endpoint-desc">Registra una mascota (nombre, tipo, foto, edad, color, temperamento, estado, observaciones) vinculada al propietario autenticado.</span></td>
            <td><span class="security-badge" style="background-color: rgba(245, 158, 11, 0.08); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.2);">JWT OWNER</span></td>
          </tr>
          <tr>
            <td><span class="method-badge post" style="background-color: rgba(59, 130, 246, 0.08); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.2);">GET</span></td>
            <td><span class="endpoint-path">/api/pets</span></td>
            <td><span class="endpoint-desc">Obtiene la lista de mascotas registradas por el propietario autenticado.</span></td>
            <td><span class="security-badge" style="background-color: rgba(245, 158, 11, 0.08); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.2);">JWT OWNER</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Swagger CTA -->
    <div class="cta-container">
      <a href="/api-docs" class="swagger-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Explorar API Interactiva (Swagger UI)
      </a>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <p>&copy; 2026 Volvid. Todos los derechos reservados.</p>
  </footer>

  <script>
    function copyToClipboard(text, btnId) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(btnId);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span style="font-size: 0.7rem; font-weight: 700; color: #10b981; font-family: sans-serif;">Copiado!</span>';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 1500);
      }).catch(err => {
        console.error('Error al copiar: ', err);
      });
    }
  </script>
</body>
</html>
  `);
});

// Swagger Router / Configuration
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api', routes);

// 404 Route handler
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;
