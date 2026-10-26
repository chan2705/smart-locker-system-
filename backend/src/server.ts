import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initDatabase } from './db/database';
import { lockerMqtt } from './mqtt/mqttClient';

import { authRouter } from './routes/authRoutes';
import { lockerRouter } from './routes/lockerRoutes';
import { shipperRouter } from './routes/shipperRoutes';
import { residentRouter } from './routes/residentRoutes';
import { rentalRouter } from './routes/rentalRoutes';
import { ekycRouter } from './routes/ekycRoutes';
import { paymentRouter } from './routes/paymentRoutes';
import { simulatorRouter } from './routes/simulatorRoutes';

const app = express();

const allowedOrigins = [
  'https://h5.zdn.vn',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.zdn.vn')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-payos-signature'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Hardware Simulator & Monitoring Dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Authentication & Core API Routes
app.use('/api/auth', authRouter);
app.use('/api/locker', lockerRouter);
app.use('/api/shipper', shipperRouter);
app.use('/api/resident', residentRouter);
app.use('/api/rental', rentalRouter);
app.use('/api/ekyc', ekycRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/simulator', simulatorRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    cabinetId: config.cabinetId,
    mqttConnected: lockerMqtt.isConnected,
    security: 'COMMERCIAL_HARDENED',
    time: new Date().toISOString(),
  });
});

// Root fallback to simulator dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and connect to MQTT broker
async function startServer() {
  console.log('--- Initializing Smart Locker Database & MQTT Bridge ---');
  await initDatabase();
  lockerMqtt.init();

  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Smart Locker Hardened Backend: http://localhost:${config.port}`);
    console.log(`🖥️  Hardware Simulator: http://localhost:${config.port}`);
    console.log(`📡 MQTT Broker: ${config.mqtt.brokerUrl}`);
    console.log(`🔒 Cabinet: ${config.cabinetId} | Master Secret: 256-bit Hex`);
    console.log(`🛡️  Security: Per-Device Key Derivation + Replay Invalidation + Tamper Detection`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
});
