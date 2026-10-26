import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cabinetId: process.env.CABINET_ID || 'CAB_01',
  
  // Security Keys
  masterSecretKey: process.env.MASTER_SECRET_KEY || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  jwtSecret: process.env.JWT_SECRET || 'SMART_LOCKER_JWT_SUPER_SECRET_2026_HARDENED',
  webhookSecretKey: process.env.WEBHOOK_SECRET_KEY || 'PAYOS_WEBHOOK_SECRET_KEY_PROD_2026',
  zaloAppId: process.env.ZALO_APP_ID || '1234567890123456789',
  zaloAppSecret: process.env.ZALO_APP_SECRET || 'zalo_app_secret_test_2026',
  
  bypassQrTimeCheck: process.env.BYPASS_QR_TIME_CHECK === 'true',
  
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883',
    clientId: process.env.MQTT_CLIENT_ID || `smart_locker_backend_${process.env.CABINET_ID || 'CAB_01'}`,
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
  },
  databaseFile: process.env.DATABASE_FILE || './locker.db',
  vietQr: {
    bankId: process.env.VIETQR_BANK_ID || '970436',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '0123456789',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'CONG TY CP TU THONG MINH IOT',
  }
};
