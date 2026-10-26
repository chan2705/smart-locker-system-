import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { config } from '../config';
import { lockerMqtt } from '../mqtt/mqttClient';
import { AuthQrService } from './authQrService';

export interface DropoffRequest {
  size: 'S' | 'M' | 'L';
  recipientPhone: string;
  shipperPhone: string;
  cab?: string;
  ts?: number;
  nonce?: number;
  sig?: string;
}

export interface PickupRequest {
  pinCode?: string;
  parcelId?: string;
  recipientPhone?: string;
  cab?: string;
  ts?: number;
  nonce?: number;
  sig?: string;
}

export class LockerService {
  public static generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static getCabinetStatus(cabId: string = config.cabinetId) {
    const cabinet = db.prepare(`SELECT * FROM cabinets WHERE id = ?`).get(cabId);
    const boxes = db.prepare(`
      SELECT b.*, 
             p.recipient_phone, p.created_at as parcel_created_at,
             r.name as rental_item_name, r.hourly_rate, r.deposit_amount
      FROM boxes b
      LEFT JOIN parcels p ON b.current_order_id = p.id AND b.status = 'OCCUPIED_PARCEL'
      LEFT JOIN rental_items r ON b.box_id = r.box_id
      WHERE b.cabinet_id = ?
      ORDER BY b.box_id ASC
    `).all(cabId);

    return { cabinet, boxes };
  }

  public static async shipperDropoff(req: DropoffRequest) {
    // 1. QR Validation with Anti-Replay Check
    if (req.cab && req.ts && req.sig) {
      const qrCheck = AuthQrService.verifyDynamicQr(req.cab, req.ts, req.sig, req.nonce || 0);
      if (!qrCheck.valid) {
        throw new Error(qrCheck.reason || 'Mã QR không hợp lệ!');
      }
    }

    // 2. Select box
    let box = db.prepare(`
      SELECT * FROM boxes 
      WHERE cabinet_id = ? AND size = ? AND status = 'AVAILABLE'
      ORDER BY box_id ASC LIMIT 1
    `).get(config.cabinetId, req.size) as any;

    if (!box) {
      box = db.prepare(`
        SELECT * FROM boxes 
        WHERE cabinet_id = ? AND status = 'AVAILABLE'
        ORDER BY box_id ASC LIMIT 1
      `).get(config.cabinetId) as any;
    }

    if (!box) {
      throw new Error(`Tủ hiện tại đã hết ngăn trống phù hợp! Vui lòng chọn tủ lân cận.`);
    }

    const pinCode = this.generatePin();
    const parcelId = `P_${Date.now().toString().slice(-6)}_${box.box_id}`;
    const now = Date.now();

    db.prepare(`
      UPDATE boxes 
      SET status = 'OCCUPIED_PARCEL', pin_code = ?, current_order_id = ?, updated_at = ?
      WHERE box_id = ?
    `).run(pinCode, parcelId, now, box.box_id);

    db.prepare(`
      INSERT INTO parcels (id, cabinet_id, box_id, recipient_phone, shipper_phone, pin_code, size, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_LOCKER', ?)
    `).run(
      parcelId,
      config.cabinetId,
      box.box_id,
      req.recipientPhone,
      req.shipperPhone,
      pinCode,
      req.size,
      now
    );

    // Fire Solenoid trigger pulse
    const unlockAck = await lockerMqtt.sendUnlockCommand(box.box_id, 400);

    // Invalidate consumed QR signature & force ESP32 nonce rotation
    if (req.cab && req.sig) {
      AuthQrService.consumeSignature(req.cab, req.sig);
    }

    return {
      success: true,
      message: `Đã mở ngăn số ${box.box_id} thành công! Shipper vui lòng đặt hàng và đóng cửa tủ.`,
      parcelId,
      boxId: box.box_id,
      size: box.size,
      pinCode,
      recipientPhone: req.recipientPhone,
      unlockAck,
    };
  }

  public static async residentPickup(req: PickupRequest) {
    if (req.cab && req.ts && req.sig) {
      const qrCheck = AuthQrService.verifyDynamicQr(req.cab, req.ts, req.sig, req.nonce || 0);
      if (!qrCheck.valid) {
        throw new Error(qrCheck.reason || 'Mã QR không hợp lệ!');
      }
    }

    let parcel: any = null;

    if (req.pinCode) {
      parcel = db.prepare(`
        SELECT * FROM parcels 
        WHERE cabinet_id = ? AND pin_code = ? AND status = 'IN_LOCKER'
      `).get(config.cabinetId, req.pinCode);
    } else if (req.parcelId) {
      parcel = db.prepare(`
        SELECT * FROM parcels 
        WHERE cabinet_id = ? AND id = ? AND status = 'IN_LOCKER'
      `).get(config.cabinetId, req.parcelId);
    }

    if (!parcel) {
      throw new Error('Không tìm thấy bưu phẩm tương ứng hoặc mã PIN không chính xác!');
    }

    // Security check: If recipientPhone is provided from JWT, verify ownership
    if (req.recipientPhone && parcel.recipient_phone !== req.recipientPhone) {
      throw new Error('Bạn không có quyền lấy kiện hàng này!');
    }

    const unlockAck = await lockerMqtt.sendUnlockCommand(parcel.box_id, 400);

    const now = Date.now();
    db.prepare(`
      UPDATE parcels SET status = 'COLLECTED', collected_at = ? WHERE id = ?
    `).run(now, parcel.id);

    db.prepare(`
      UPDATE boxes 
      SET status = 'AVAILABLE', pin_code = NULL, current_order_id = NULL, item_detected = 0, updated_at = ?
      WHERE box_id = ?
    `).run(now, parcel.box_id);

    // Invalidate consumed QR signature & force ESP32 nonce rotation
    if (req.cab && req.sig) {
      AuthQrService.consumeSignature(req.cab, req.sig);
    }

    return {
      success: true,
      message: `Đã mở ngăn số ${parcel.box_id}. Cư dân vui lòng lấy đồ và đóng chặt cửa tủ!`,
      boxId: parcel.box_id,
      parcelId: parcel.id,
      unlockAck,
    };
  }

  public static getResidentParcels(phone: string, cabId: string = config.cabinetId) {
    const parcels = db.prepare(`
      SELECT p.*, b.door_state, b.item_detected
      FROM parcels p
      JOIN boxes b ON p.box_id = b.box_id AND p.cabinet_id = b.cabinet_id
      WHERE p.recipient_phone = ? AND p.cabinet_id = ? AND p.status = 'IN_LOCKER'
      ORDER BY p.created_at DESC
    `).all(phone, cabId);

    return parcels;
  }
}
