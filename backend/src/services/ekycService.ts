import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

export interface EkycVerifyRequest {
  phone: string;
  frontCardImg?: string;
  backCardImg?: string;
  faceVideoOrSelfie?: string;
  fullName?: string;
  idCardNo?: string;
}

export class EkycService {
  /**
   * Check if a phone number has already passed eKYC verification
   */
  public static getEkycStatus(phone: string) {
    const record = db.prepare(`
      SELECT * FROM ekyc_records WHERE phone = ? AND verified = 1
    `).get(phone) as any;

    if (record) {
      return {
        verified: true,
        record: {
          fullName: record.full_name,
          idCardNo: record.id_card_no,
          phone: record.phone,
          livenessScore: record.liveness_score,
          verifiedAt: record.created_at,
        }
      };
    }

    return {
      verified: false,
      message: 'Tài khoản chưa định danh eKYC',
    };
  }

  /**
   * Simulates AI OCR (CCCD Front/Back) + Face Liveness Anti-Spoofing Check
   */
  public static async verifyEkyc(req: EkycVerifyRequest) {
    if (!req.phone) {
      throw new Error('Số điện thoại không được để trống!');
    }

    // Realistic simulated OCR extracted data
    const idCardNo = req.idCardNo || `0${Math.floor(10000000000 + Math.random() * 89999999999)}`;
    const fullName = req.fullName || 'NGUYỄN VĂN AN';
    const dob = '15/08/1996';
    const livenessScore = Number((0.95 + Math.random() * 0.04).toFixed(3)); // 95% - 99% confidence

    const id = uuidv4();
    const now = Date.now();

    // Upsert eKYC record
    db.prepare(`
      INSERT INTO ekyc_records (id, phone, id_card_no, full_name, dob, liveness_score, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(phone) DO UPDATE SET
        id_card_no = excluded.id_card_no,
        full_name = excluded.full_name,
        liveness_score = excluded.liveness_score,
        verified = 1,
        created_at = excluded.created_at
    `).run(id, req.phone, idCardNo, fullName, dob, livenessScore, now);

    return {
      success: true,
      message: 'Xác thực định danh eKYC & Liveness Face Check thành công!',
      data: {
        phone: req.phone,
        fullName,
        idCardNo,
        dob,
        livenessScore,
        verified: true,
        antiSpoofing: 'PASSED',
      }
    };
  }
}
