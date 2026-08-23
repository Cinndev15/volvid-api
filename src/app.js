import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Volvid API'
  });
});

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
