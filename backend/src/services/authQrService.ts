import crypto from 'crypto';
import { config } from '../config';
import { lockerMqtt } from '../mqtt/mqttClient';

export interface DynamicQrParams {
  cab: string;
  ts: number;
  nonce?: number;
  sig: string;
}

interface UsedSignatureEntry {
  usedAt: number;
  expiresAt: number;
}

export class AuthQrService {
  // Anti-Replay Cache: In-memory store of consumed signatures with 120s TTL
  private static usedSignatures: Map<string, UsedSignatureEntry> = new Map();
  private static activeNonces: Map<string, number> = new Map();

  /**
   * Derives a cryptographic Per-Device Key from Master Secret Key:
   * deviceKey = HMAC_SHA256(MASTER_SECRET_KEY, cabinetId)
   */
  public static deriveDeviceKey(cabinetId: string): string {
    const hmac = crypto.createHmac('sha256', config.masterSecretKey);
    hmac.update(cabinetId);
    return hmac.digest('hex'); // 64 hex characters (256-bit derived key)
  }

  /**
   * Computes the 16-character (64-bit) HMAC-SHA256 signature for a cabinet at a given epoch timestamp and nonce counter
   */
  public static computeSignature(cab: string, ts: number, nonce: number = 0): string {
    const deviceKey = this.deriveDeviceKey(cab);
    const message = `${cab}:${ts}:${nonce}`;
    const hmac = crypto.createHmac('sha256', deviceKey);
    hmac.update(message);
    const fullHex = hmac.digest('hex');
    return fullHex.substring(0, 16); // 16 Hex characters (64-bit)
  }

  /**
   * Generates complete Dynamic QR URL compliant with 16-character Hex & Nonce Counter
   */
  public static generateDynamicQr(cab: string = config.cabinetId, timestamp?: number, nonce?: number): {
    cab: string;
    ts: number;
    nonce: number;
    sig: string;
    url: string;
  } {
    const ts = timestamp ?? Math.floor(Date.now() / 1000);
    const currentNonce = nonce ?? (this.activeNonces.get(cab) || 0);
    const sig = this.computeSignature(cab, ts, currentNonce);
    const url = `https://zalo.me/s/smartlocker/?utm_source=zalo-qr&cab=${cab}&ts=${ts}&nonce=${currentNonce}&sig=${sig}`;
    return { cab, ts, nonce: currentNonce, sig, url };
  }

  /**
   * Validates dynamic QR with Per-Device Derived Key, 16-char Hex, Nonce, TimingSafeEqual, and Replay Invalidation
   */
  public static verifyDynamicQr(cab: string, ts: number, sig: string, nonce: number = 0): {
    valid: boolean;
    reason?: string;
    serverTs: number;
    driftSeconds: number;
  } {
    const serverTs = Math.floor(Date.now() / 1000);
    const driftSeconds = Math.abs(serverTs - ts);
    const normalizedSig = sig.trim().toLowerCase();

    // 1. Anti-Replay Attack Check (Consumed Signature Invalidation)
    this.cleanExpiredSignatures();
    if (this.usedSignatures.has(normalizedSig)) {
      return {
        valid: false,
        reason: 'Phát hiện tấn công phát lại (Replay Attack Detected)! Mã QR này đã được sử dụng trước đó.',
        serverTs,
        driftSeconds,
      };
    }

    // 2. Length check: Must be 16 Hex characters
    if (normalizedSig.length !== 16) {
      return {
        valid: false,
        reason: `Độ dài chữ ký không hợp lệ (${normalizedSig.length}/16 hex characters).`,
        serverTs,
        driftSeconds,
      };
    }

    // 3. Constant-time signature verification (Timing-Safe Comparator)
    const expectedSig = this.computeSignature(cab, ts, nonce).toLowerCase();
    const sigBuffer = Buffer.from(normalizedSig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {
        valid: false,
        reason: 'Chữ ký QR không hợp lệ (Signature Mismatch / Anti-Spoofing Triggered)',
        serverTs,
        driftSeconds,
      };
    }

    // 4. Temporal drift check (Anti-Remote Trigger)
    if (!config.bypassQrTimeCheck) {
      if (driftSeconds > 60) {
        return {
          valid: false,
          reason: `Mã QR đã hết hạn (Độ lệch thời gian: ${driftSeconds}s > 60s). Vui lòng quét mã QR mới trên màn hình tủ.`,
          serverTs,
          driftSeconds,
        };
      }
    }

    return {
      valid: true,
      serverTs,
      driftSeconds,
    };
  }

  /**
   * Consumes a verified signature immediately after a successful locker operation:
   * 1. Marks signature as consumed with 120s TTL
   * 2. Triggers out-of-band MQTT command to force ESP32-S3 nonceCounter++ and screen rotation
   */
  public static consumeSignature(cab: string, sig: string): void {
    const normalizedSig = sig.trim().toLowerCase();
    const now = Date.now();
    this.usedSignatures.set(normalizedSig, {
      usedAt: now,
      expiresAt: now + 120000, // 120 seconds TTL
    });

    // Increment backend tracking nonce
    const nextNonce = (this.activeNonces.get(cab) || 0) + 1;
    this.activeNonces.set(cab, nextNonce);

    // Notify ESP32-S3 via MQTT to rotate nonce counter immediately
    lockerMqtt.forceRotateNonce(cab, nextNonce);
  }

  private static cleanExpiredSignatures(): void {
    const now = Date.now();
    for (const [key, value] of this.usedSignatures.entries()) {
      if (now > value.expiresAt) {
        this.usedSignatures.delete(key);
      }
    }
  }
}
