import express from 'express';
import dotenv from 'dotenv';
import DatabaseClient from './Database/db.client';
import { createAuthRoutes } from './Routes/auth.routes';
import { createOrganizationRoutes } from './Routes/organization.routes';
import { exceptionHandler } from './Middleware/exceptionHandler.middleware';
import logger from './Utils/logger.util';
import { PORT, OK_STATUS } from './config/properties';
import packageJson from '../package.json';


// Load environment variables
dotenv.config();

const app = express();
const serverPort = PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: OK_STATUS, 
    service: packageJson.name,
    version: packageJson.version,
    timestamp: new Date().toISOString()
  });
});

// Auth routes with versioning
const authRoutes = createAuthRoutes(process.env.DATABASE_URL || '');
app.use('/api/auth', authRoutes);

// Organization routes with versioning
const organizationRoutes = createOrganizationRoutes();
app.use('/api/organizations', organizationRoutes);

// Global error handler (must be after all routes)
app.use(exceptionHandler);


app.listen(serverPort, async () => {
  logger.info(`Auth Service is running on port ${serverPort}`);
});

