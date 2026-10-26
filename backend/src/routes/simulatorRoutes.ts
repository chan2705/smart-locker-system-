import { Router, Request, Response } from 'express';
import { lockerMqtt } from '../mqtt/mqttClient';
import { db } from '../db/database';
import { config } from '../config';

export const simulatorRouter = Router();

// Toggle door open/closed for a box
simulatorRouter.post('/door', (req: Request, res: Response) => {
  try {
    const { box_id, door_state } = req.body;
    if (!box_id || !door_state) {
      return res.status(400).json({ success: false, error: 'box_id and door_state (OPENED/CLOSED) required' });
    }

    const state = door_state === 'OPENED' ? 'DOOR_OPENED' : 'DOOR_CLOSED';
    lockerMqtt.simulateHardwareEvent({
      box_id: Number(box_id),
      event: state,
      door_state: door_state,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: `Box ${box_id} door set to ${door_state}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger Tamper Alarm (Forced Entry Crowbar Breach Simulation)
simulatorRouter.post('/tamper-alarm', (req: Request, res: Response) => {
  try {
    const { box_id } = req.body;
    if (!box_id) {
      return res.status(400).json({ success: false, error: 'box_id is required' });
    }

    lockerMqtt.simulateAlarmEvent({
      event: 'FORCED_ENTRY_DETECTED',
      cabinet_id: config.cabinetId,
      box_id: Number(box_id),
      timestamp: Date.now(),
    });

    res.json({ success: true, message: `🚨 Cảnh báo cậy cửa khẩn cấp đã kích hoạt trên ngăn ${box_id}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle item sensor (present/absent)
simulatorRouter.post('/item', (req: Request, res: Response) => {
  try {
    const { box_id, item_detected } = req.body;
    if (!box_id || item_detected === undefined) {
      return res.status(400).json({ success: false, error: 'box_id and item_detected (boolean) required' });
    }

    const hasItem = Boolean(item_detected);
    lockerMqtt.simulateHardwareEvent({
      box_id: Number(box_id),
      event: hasItem ? 'ITEM_DETECTED' : 'ITEM_REMOVED',
      item_detected: hasItem,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: `Box ${box_id} item_detected set to ${hasItem}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate RFID Card tap on a locker box
simulatorRouter.post('/rfid', (req: Request, res: Response) => {
  try {
    const { box_id, rfid_uid } = req.body;
    if (!box_id || !rfid_uid) {
      return res.status(400).json({ success: false, error: 'box_id and rfid_uid required' });
    }

    lockerMqtt.simulateHardwareEvent({
      box_id: Number(box_id),
      event: 'RFID_TAG_SCANNED',
      rfid_uid: rfid_uid,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: `Simulated RFID tap ${rfid_uid} on box ${box_id}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get recent MQTT logs
simulatorRouter.get('/logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM mqtt_logs WHERE cabinet_id = ? ORDER BY id DESC LIMIT 50
    `).all(config.cabinetId);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SSE Stream for live updates to the simulator UI
simulatorRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onMqttMessage = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'mqtt', payload: data })}\n\n`);
  };

  const onRentalCompleted = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'rental_completed', payload: data })}\n\n`);
  };

  const onSecurityAlarm = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'security_alarm', payload: data })}\n\n`);
  };

  const onNonceRotated = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'nonce_rotated', payload: data })}\n\n`);
  };

  lockerMqtt.on('mqtt_message', onMqttMessage);
  lockerMqtt.on('rental_completed', onRentalCompleted);
  lockerMqtt.on('security_alarm', onSecurityAlarm);
  lockerMqtt.on('nonce_rotated', onNonceRotated);

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    lockerMqtt.off('mqtt_message', onMqttMessage);
    lockerMqtt.off('rental_completed', onRentalCompleted);
    lockerMqtt.off('security_alarm', onSecurityAlarm);
    lockerMqtt.off('nonce_rotated', onNonceRotated);
  });
});
