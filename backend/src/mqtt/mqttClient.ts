import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { db } from '../db/database';

export interface UnlockCommand {
  tx_id: string;
  box_id?: number;
  action: 'UNLOCK' | 'FORCE_ROTATE_NONCE';
  pulse_ms?: number;
  nonce?: number;
  timestamp: number;
}

export interface LockerAck {
  tx_id: string;
  box_id: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  door_state: 'OPENED' | 'CLOSED';
  limit_switch_raw?: number;
  error_message?: string;
  timestamp: number;
}

export interface LockerEvent {
  box_id: number;
  event: 'DOOR_OPENED' | 'DOOR_CLOSED' | 'ITEM_DETECTED' | 'ITEM_REMOVED' | 'RFID_TAG_SCANNED' | 'HEARTBEAT';
  door_state?: 'OPENED' | 'CLOSED';
  item_detected?: boolean;
  rfid_uid?: string;
  timestamp: number;
}

export interface SecurityAlarmEvent {
  event: 'FORCED_ENTRY_DETECTED' | 'TAMPER_ALERT';
  cabinet_id: string;
  box_id: number;
  timestamp: number;
}

class LockerMqttService extends EventEmitter {
  private client: MqttClient | null = null;
  private pendingUnlocks: Map<string, {
    resolve: (ack: LockerAck) => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = new Map();

  public isConnected: boolean = false;

  public init() {
    console.log(`[MQTT] Connecting to broker: ${config.mqtt.brokerUrl} as ${config.mqtt.clientId}...`);
    this.client = mqtt.connect(config.mqtt.brokerUrl, {
      clientId: config.mqtt.clientId,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      username: config.mqtt.username,
      password: config.mqtt.password,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log(`[MQTT] Connected successfully to ${config.mqtt.brokerUrl}`);

      const ackTopic = `locker/${config.cabinetId}/ack`;
      const eventTopic = `locker/${config.cabinetId}/event`;
      const statusTopic = `locker/${config.cabinetId}/status`;
      const alarmTopic = `locker/${config.cabinetId}/alarm`;

      this.client?.subscribe([ackTopic, eventTopic, statusTopic, alarmTopic], (err) => {
        if (err) {
          console.error(`[MQTT] Failed to subscribe:`, err);
        } else {
          console.log(`[MQTT] Subscribed to ${ackTopic}, ${eventTopic}, ${statusTopic}, ${alarmTopic}`);
        }
      });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.warn(`[MQTT] Connection closed`);
    });

    this.client.on('error', (err) => {
      console.error(`[MQTT] Error:`, err);
    });

    this.client.on('message', (topic, payload) => {
      this.handleIncomingMessage(topic, payload.toString());
    });
  }

  private handleIncomingMessage(topic: string, messageStr: string) {
    try {
      const data = JSON.parse(messageStr);
      const now = Date.now();

      // Log MQTT packet into database
      try {
        db.prepare(`
          INSERT INTO mqtt_logs (cabinet_id, topic, direction, payload, created_at)
          VALUES (?, ?, 'IN', ?, ?)
        `).run(config.cabinetId, topic, messageStr, now);
      } catch (e) {
        // ignore logging error
      }

      this.emit('mqtt_message', { topic, data, timestamp: now });

      if (topic.endsWith('/ack')) {
        this.handleAck(data as LockerAck);
      } else if (topic.endsWith('/event')) {
        this.handleEvent(data as LockerEvent);
      } else if (topic.endsWith('/alarm')) {
        this.handleAlarm(data as SecurityAlarmEvent);
      } else if (topic.endsWith('/status')) {
        db.prepare(`UPDATE cabinets SET last_heartbeat = ?, status = 'ONLINE' WHERE id = ?`)
          .run(now, config.cabinetId);
      }
    } catch (e) {
      console.error(`[MQTT] Error parsing message from ${topic}:`, e);
    }
  }

  private handleAlarm(alarm: SecurityAlarmEvent) {
    console.error(`🚨 [CRITICAL SECURITY ALARM] Box ${alarm.box_id} TAMPER BREACH DETECTED:`, alarm);
    const now = Date.now();

    try {
      // Record to security alarms table
      db.prepare(`
        INSERT INTO security_alarms (cabinet_id, box_id, event, created_at)
        VALUES (?, ?, ?, ?)
      `).run(config.cabinetId, alarm.box_id, alarm.event, now);

      // Flag box as TAMPERED_ALERT in database
      db.prepare(`
        UPDATE boxes 
        SET status = 'TAMPERED_ALERT', door_state = 'OPENED', updated_at = ?
        WHERE box_id = ? AND cabinet_id = ?
      `).run(now, alarm.box_id, config.cabinetId);
    } catch (err) {
      console.error('[MQTT ALARM] DB logging error:', err);
    }

    this.emit('security_alarm', alarm);
  }

  private handleAck(ack: LockerAck) {
    console.log(`[MQTT ACK] Box ${ack.box_id} -> Status: ${ack.status}, Door: ${ack.door_state}`);

    try {
      db.prepare(`
        UPDATE boxes 
        SET door_state = ?, updated_at = ?
        WHERE box_id = ? AND cabinet_id = ?
      `).run(ack.door_state, Date.now(), ack.box_id, config.cabinetId);
    } catch (err) {
      console.error('[MQTT ACK] DB update error:', err);
    }

    if (ack.tx_id && this.pendingUnlocks.has(ack.tx_id)) {
      const pending = this.pendingUnlocks.get(ack.tx_id)!;
      clearTimeout(pending.timer);
      pending.resolve(ack);
      this.pendingUnlocks.delete(ack.tx_id);
    }

    this.emit('locker_ack', ack);
  }

  private handleEvent(event: LockerEvent) {
    console.log(`[MQTT EVENT] Box ${event.box_id} -> Event: ${event.event}`, event);
    const now = Date.now();

    if (event.event === 'DOOR_CLOSED') {
      db.prepare(`
        UPDATE boxes 
        SET door_state = 'CLOSED', updated_at = ?
        WHERE box_id = ? AND cabinet_id = ?
      `).run(now, event.box_id, config.cabinetId);
    } else if (event.event === 'DOOR_OPENED') {
      db.prepare(`
        UPDATE boxes 
        SET door_state = 'OPENED', updated_at = ?
        WHERE box_id = ? AND cabinet_id = ?
      `).run(now, event.box_id, config.cabinetId);
    }

    if (typeof event.item_detected === 'boolean') {
      db.prepare(`
        UPDATE boxes 
        SET item_detected = ?, updated_at = ?
        WHERE box_id = ? AND cabinet_id = ?
      `).run(event.item_detected ? 1 : 0, now, event.box_id, config.cabinetId);
    }

    if (event.event === 'RFID_TAG_SCANNED' && event.rfid_uid) {
      this.handleRfidReturn(event.box_id, event.rfid_uid);
    }

    this.emit('locker_event', event);
  }

  private handleRfidReturn(boxId: number, rfidUid: string) {
    console.log(`[RFID RETURN CHECK] Box ${boxId} detected RFID: ${rfidUid}`);
    const order = db.prepare(`
      SELECT o.*, i.name as item_name, i.rfid_uid as expected_rfid
      FROM rental_orders o
      JOIN rental_items i ON o.item_id = i.id
      WHERE o.box_id = ? AND o.order_status IN ('ACTIVE', 'RETURN_PENDING')
      ORDER BY o.created_at DESC LIMIT 1
    `).get(boxId) as any;

    if (order) {
      if (order.expected_rfid.toLowerCase() === rfidUid.toLowerCase()) {
        console.log(`[RFID MATCHED] Correct item ${order.item_name} returned to Box ${boxId}! Auto-refund triggered.`);

        db.prepare(`
          UPDATE rental_orders 
          SET order_status = 'COMPLETED', deposit_status = 'REFUNDED', end_time = ?
          WHERE id = ?
        `).run(Date.now(), order.id);

        db.prepare(`
          UPDATE rental_items SET status = 'AVAILABLE' WHERE id = ?
        `).run(order.item_id);

        db.prepare(`
          UPDATE boxes 
          SET status = 'OCCUPIED_RENTAL', item_detected = 1, current_order_id = NULL, updated_at = ?
          WHERE box_id = ?
        `).run(Date.now(), boxId);

        this.emit('rental_completed', { orderId: order.id, boxId, rfidUid, status: 'COMPLETED' });
      } else {
        console.warn(`[RFID MISMATCH] Scanned ${rfidUid} but expected ${order.expected_rfid}!`);
      }
    }
  }

  public async sendUnlockCommand(boxId: number, pulseMs: number = 400, timeoutMs: number = 3000): Promise<LockerAck> {
    const txId = uuidv4();
    const cmdTopic = `locker/${config.cabinetId}/cmd`;
    const payload: UnlockCommand = {
      tx_id: txId,
      box_id: boxId,
      action: 'UNLOCK',
      pulse_ms: pulseMs,
      timestamp: Date.now(),
    };

    const payloadStr = JSON.stringify(payload);

    try {
      db.prepare(`
        INSERT INTO mqtt_logs (cabinet_id, topic, direction, payload, created_at)
        VALUES (?, ?, 'OUT', ?, ?)
      `).run(config.cabinetId, cmdTopic, payloadStr, Date.now());
    } catch (e) {
      // ignore
    }

    if (!this.client || !this.isConnected) {
      console.warn(`[MQTT] Offline simulation for box ${boxId}`);
      db.prepare(`
        UPDATE boxes SET door_state = 'OPENED', updated_at = ? WHERE box_id = ? AND cabinet_id = ?
      `).run(Date.now(), boxId, config.cabinetId);

      return {
        tx_id: txId,
        box_id: boxId,
        status: 'SUCCESS',
        door_state: 'OPENED',
        timestamp: Date.now(),
      };
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingUnlocks.delete(txId);
        db.prepare(`
          UPDATE boxes SET door_state = 'OPENED', updated_at = ? WHERE box_id = ?
        `).run(Date.now(), boxId);

        resolve({
          tx_id: txId,
          box_id: boxId,
          status: 'SUCCESS',
          door_state: 'OPENED',
          timestamp: Date.now(),
        });
      }, timeoutMs);

      this.pendingUnlocks.set(txId, { resolve, reject: () => { }, timer });

      this.client!.publish(cmdTopic, payloadStr, { qos: 1 });
    });
  }

  /**
   * Forces ESP32-S3 to rotate its Nonce Counter out-of-band and refresh the Dynamic QR on LCD
   */
  public forceRotateNonce(cabinetId: string, nextNonce: number): void {
    const cmdTopic = `locker/${cabinetId}/cmd`;
    const payload: UnlockCommand = {
      tx_id: uuidv4(),
      action: 'FORCE_ROTATE_NONCE',
      nonce: nextNonce,
      timestamp: Date.now(),
    };

    const payloadStr = JSON.stringify(payload);
    console.log(`[MQTT] Sending FORCE_ROTATE_NONCE to ${cmdTopic}: Nonce=${nextNonce}`);

    if (this.client && this.isConnected) {
      this.client.publish(cmdTopic, payloadStr, { qos: 1 });
    }

    this.emit('nonce_rotated', { cabinetId, nonce: nextNonce, timestamp: Date.now() });
  }

  public simulateHardwareEvent(event: LockerEvent) {
    this.handleEvent(event);
  }

  public simulateAlarmEvent(alarm: SecurityAlarmEvent) {
    this.handleAlarm(alarm);
  }
}

export const lockerMqtt = new LockerMqttService();
