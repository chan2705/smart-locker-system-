import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { config } from '../config';
import { lockerMqtt } from '../mqtt/mqttClient';
import { EkycService } from './ekycService';
import { AuthQrService } from './authQrService';

export class PaymentService {
  public static getRentalCatalog() {
    const items = db.prepare(`
      SELECT r.*, b.status as box_status, b.door_state, b.item_detected
      FROM rental_items r
      JOIN boxes b ON r.box_id = b.box_id
      ORDER BY r.box_id ASC
    `).all();

    return items;
  }

  public static generateVietQr(orderId: string, amount: number) {
    const bankId = config.vietQr.bankId;
    const accountNo = config.vietQr.accountNo;
    const accountName = encodeURIComponent(config.vietQr.accountName);
    const content = encodeURIComponent(orderId);

    const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${content}&accountName=${accountName}`;
    
    return {
      bankId,
      bankName: 'Vietcombank (Ngân hàng TMCP Ngoại Thương Việt Nam)',
      accountNo,
      accountName: config.vietQr.accountName,
      amount,
      content: orderId,
      qrImageUrl,
    };
  }

  public static async createRentalOrder(
    userPhone: string,
    itemId: string,
    qrAuth?: { cab?: string; ts?: number; nonce?: number; sig?: string }
  ) {
    if (qrAuth?.cab && qrAuth?.ts && qrAuth?.sig) {
      const qrCheck = AuthQrService.verifyDynamicQr(qrAuth.cab, qrAuth.ts, qrAuth.sig, qrAuth.nonce || 0);
      if (!qrCheck.valid) {
        throw new Error(qrCheck.reason || 'Mã QR không hợp lệ!');
      }
    }

    const ekyc = EkycService.getEkycStatus(userPhone);
    if (!ekyc.verified) {
      throw new Error('Bạn cần hoàn tất định danh eKYC trước khi thuê thiết bị giá trị cao!');
    }

    const item = db.prepare(`SELECT * FROM rental_items WHERE id = ?`).get(itemId) as any;
    if (!item) {
      throw new Error('Món đồ cần thuê không tồn tại!');
    }

    if (item.status !== 'AVAILABLE') {
      throw new Error(`Món đồ "${item.name}" hiện đang có người thuê hoặc đang bảo trì!`);
    }

    const orderId = `RENT_${Date.now().toString().slice(-6)}_${item.box_id}`;
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();

    db.prepare(`
      INSERT INTO rental_orders (
        id, item_id, box_id, user_phone, user_name, id_card_no, 
        deposit_amount, deposit_status, order_status, pin_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 'RESERVED', ?, ?)
    `).run(
      orderId,
      item.id,
      item.box_id,
      userPhone,
      ekyc.record!.fullName,
      ekyc.record!.idCardNo,
      item.deposit_amount,
      pinCode,
      now
    );

    const vietQr = this.generateVietQr(orderId, item.deposit_amount);

    return {
      success: true,
      message: 'Tạo đơn thuê đồ thành công. Vui lòng thanh toán cọc VietQR để mở tủ lấy thiết bị.',
      order: {
        orderId,
        itemId: item.id,
        itemName: item.name,
        boxId: item.box_id,
        hourlyRate: item.hourly_rate,
        depositAmount: item.deposit_amount,
        pinCode,
        vietQr,
      }
    };
  }

  /**
   * Hardened Webhook Processor with Idempotency & Cryptographic Signature Check
   */
  public static async processDepositWebhook(
    orderId: string,
    amount?: number,
    paymentTxId?: string,
    signatureHeader?: string
  ) {
    const txId = paymentTxId || `TX_${Date.now()}`;

    // 1. Idempotency Check: Prevent duplicate payment processing
    const processed = db.prepare(`SELECT * FROM processed_payments WHERE payment_tx_id = ?`).get(txId);
    if (processed) {
      console.warn(`[IDEMPOTENCY] Payment transaction ${txId} was already processed. Skipping.`);
      return {
        success: true,
        message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)',
        isDuplicate: true,
      };
    }

    // 2. Cryptographic Signature Validation if signature header provided
    if (signatureHeader) {
      const expectedPayload = `${orderId}:${amount || 0}:${txId}`;
      const hmac = crypto.createHmac('sha256', config.webhookSecretKey);
      hmac.update(expectedPayload);
      const expectedSig = hmac.digest('hex');

      const sigBuffer = Buffer.from(signatureHeader.toLowerCase());
      const expectedBuffer = Buffer.from(expectedSig.toLowerCase());

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        throw new Error('Chữ ký Webhook không hợp lệ (Invalid x-payos-signature)!');
      }
    }

    const order = db.prepare(`
      SELECT o.*, i.name as item_name
      FROM rental_orders o
      JOIN rental_items i ON o.item_id = i.id
      WHERE o.id = ?
    `).get(orderId) as any;

    if (!order) {
      throw new Error(`Không tìm thấy đơn thuê hàng: ${orderId}`);
    }

    if (order.deposit_status === 'PAID') {
      return {
        success: true,
        message: 'Đơn hàng này đã được thanh toán cọc trước đó.',
        order,
      };
    }

    const now = Date.now();

    // Mark payment transaction as processed
    db.prepare(`
      INSERT INTO processed_payments (payment_tx_id, order_id, amount, created_at)
      VALUES (?, ?, ?, ?)
    `).run(txId, orderId, order.deposit_amount, now);

    // Update order status
    db.prepare(`
      UPDATE rental_orders 
      SET deposit_status = 'PAID', order_status = 'ACTIVE', start_time = ?, tx_hash = ?
      WHERE id = ?
    `).run(now, txId, orderId);

    db.prepare(`
      UPDATE rental_items SET status = 'RENTED' WHERE id = ?
    `).run(order.item_id);

    // Unlock box over MQTT for customer to take tool
    const unlockAck = await lockerMqtt.sendUnlockCommand(order.box_id, 400);

    return {
      success: true,
      message: `Nhận cọc VietQR thành công! Đã bung chốt mở ngăn số ${order.box_id} để quý khách nhận thiết bị "${order.item_name}".`,
      boxId: order.box_id,
      orderId,
      depositAmount: order.deposit_amount,
      unlockAck,
    };
  }

  public static async openForReturn(
    orderId: string,
    qrAuth?: { cab?: string; ts?: number; nonce?: number; sig?: string }
  ) {
    if (qrAuth?.cab && qrAuth?.ts && qrAuth?.sig) {
      const qrCheck = AuthQrService.verifyDynamicQr(qrAuth.cab, qrAuth.ts, qrAuth.sig, qrAuth.nonce || 0);
      if (!qrCheck.valid) {
        throw new Error(qrCheck.reason || 'Mã QR không hợp lệ!');
      }
    }

    const order = db.prepare(`SELECT * FROM rental_orders WHERE id = ?`).get(orderId) as any;
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần trả đồ!');
    }

    db.prepare(`UPDATE rental_orders SET order_status = 'RETURN_PENDING' WHERE id = ?`).run(orderId);

    const unlockAck = await lockerMqtt.sendUnlockCommand(order.box_id, 400);

    if (qrAuth?.cab && qrAuth?.sig) {
      AuthQrService.consumeSignature(qrAuth.cab, qrAuth.sig);
    }

    return {
      success: true,
      message: `Đã mở ngăn số ${order.box_id}. Vui lòng đặt đồ vào ngăn tủ để cảm biến RFID tự động kiểm tra hoàn cọc!`,
      boxId: order.box_id,
      orderId,
      unlockAck,
    };
  }

  public static getUserRentalOrders(phone: string) {
    const orders = db.prepare(`
      SELECT o.*, i.name as item_name, i.image_url, i.category, i.hourly_rate, i.rfid_uid
      FROM rental_orders o
      JOIN rental_items i ON o.item_id = i.id
      WHERE o.user_phone = ?
      ORDER BY o.created_at DESC
    `).all(phone);

    return orders;
  }
}
