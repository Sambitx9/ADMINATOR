import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive system health-check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING'
  };

  const isHealthy = dbState === 1 || dbState === 2;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    statusCode: isHealthy ? 200 : 503,
    data: {
      status: isHealthy ? 'OPERATIONAL' : 'DEGRADED',
      appName: 'ADMINATOR',
      tagline: 'SMART ADMISSIONS. ZERO CHAOS.',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      mode: 'LOCAL_DETERMINISTIC',
      database: {
        engine: 'MongoDB Community Edition',
        status: dbStatusMap[dbState] || 'UNKNOWN',
        host: mongoose.connection.host || '127.0.0.1',
        port: mongoose.connection.port || 27017,
        name: mongoose.connection.name || 'adminator_demo'
      },
      zeroCostBudget: {
        budgetSpent: '₹0.00',
        paidServicesUsed: false,
        commercialGatewaysActive: false,
        aiMode: process.env.AI_PROVIDER || 'deterministic'
      },
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
