import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { config } from '../config';

const dbPath = path.isAbsolute(config.databaseFile)
  ? config.databaseFile
  : path.resolve(__dirname, '../../', config.databaseFile);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlInstance: SqlJsDatabase;

// Synchronous wrapper to preserve clean prepared statement syntax
class PreparedStatement {
  private sql: string;
  constructor(sql: string) {
    this.sql = sql;
  }

  run(...params: any[]) {
    sqlInstance.run(this.sql, params);
    saveDb();
    return { changes: 1 };
  }

  get(...params: any[]) {
    const stmt = sqlInstance.prepare(this.sql);
    try {
      if (params.length > 0) {
        stmt.bind(params);
      }
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params: any[]) {
    const stmt = sqlInstance.prepare(this.sql);
    const results: any[] = [];
    try {
      if (params.length > 0) {
        stmt.bind(params);
      }
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }
}

function saveDb() {
  try {
    const data = sqlInstance.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('Failed to persist database:', e);
  }
}

export const db = {
  prepare(sql: string) {
    return new PreparedStatement(sql);
  },
  exec(sql: string) {
    sqlInstance.exec(sql);
    saveDb();
  },
  pragma(pragmaStr: string) {
    // pragma no-op for sql.js in-memory wasm
  }
};

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    sqlInstance = new SQL.Database(filebuffer);
  } else {
    sqlInstance = new SQL.Database();
  }

  sqlInstance.exec(`
    CREATE TABLE IF NOT EXISTS cabinets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'ONLINE',
      last_heartbeat INTEGER
    );

    CREATE TABLE IF NOT EXISTS boxes (
      box_id INTEGER PRIMARY KEY,
      cabinet_id TEXT NOT NULL,
      size TEXT NOT NULL CHECK(size IN ('S', 'M', 'L')),
      status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED_PARCEL', 'OCCUPIED_RENTAL', 'ERROR_JAMMED', 'TAMPERED_ALERT')),
      door_state TEXT NOT NULL DEFAULT 'CLOSED' CHECK(door_state IN ('OPENED', 'CLOSED')),
      item_detected INTEGER NOT NULL DEFAULT 0,
      pin_code TEXT,
      current_order_id TEXT,
      rfid_uid TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id TEXT PRIMARY KEY,
      cabinet_id TEXT NOT NULL,
      box_id INTEGER NOT NULL,
      recipient_phone TEXT NOT NULL,
      shipper_phone TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      size TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IN_LOCKER' CHECK(status IN ('PENDING_DROPOFF', 'IN_LOCKER', 'COLLECTED', 'CANCELLED')),
      created_at INTEGER NOT NULL,
      collected_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS rental_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      box_id INTEGER NOT NULL,
      hourly_rate INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE')),
      rfid_uid TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rental_orders (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      box_id INTEGER NOT NULL,
      user_phone TEXT NOT NULL,
      user_name TEXT NOT NULL,
      id_card_no TEXT NOT NULL,
      deposit_amount INTEGER NOT NULL,
      deposit_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(deposit_status IN ('PENDING', 'PAID', 'REFUNDED')),
      order_status TEXT NOT NULL DEFAULT 'RESERVED' CHECK(order_status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED')),
      start_time INTEGER,
      end_time INTEGER,
      pin_code TEXT NOT NULL,
      tx_hash TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ekyc_records (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      id_card_no TEXT NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      liveness_score REAL NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mqtt_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('IN', 'OUT')),
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Commercial Hardened Security: Idempotent Payment & Security Alarms
    CREATE TABLE IF NOT EXISTS processed_payments (
      payment_tx_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id TEXT NOT NULL,
      box_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Seed default Cabinet
  const existingCab = db.prepare(`SELECT id FROM cabinets WHERE id = ?`).get(config.cabinetId);
  if (!existingCab) {
    db.prepare(`
      INSERT INTO cabinets (id, name, location, status, last_heartbeat)
      VALUES (?, ?, ?, 'ONLINE', ?)
    `).run(
      config.cabinetId,
      'Tủ Thông Minh SmartLocker - Tòa S2.05 Vinhomes Grand Park',
      'Sảnh Lễ Tân Tháp A, 128 Nguyễn Xiển, Long Thạnh Mỹ, TP. Thủ Đức',
      Date.now()
    );
  }

  // Seed 12 Boxes
  const boxCountRes = db.prepare(`SELECT count(*) as count FROM boxes WHERE cabinet_id = ?`).get(config.cabinetId) as any;
  const boxCount = boxCountRes ? boxCountRes.count : 0;
  if (boxCount === 0) {
    const insertBox = db.prepare(`
      INSERT INTO boxes (box_id, cabinet_id, size, status, door_state, item_detected, pin_code, rfid_uid, updated_at)
      VALUES (?, ?, ?, ?, 'CLOSED', ?, ?, ?, ?)
    `);

    const now = Date.now();
    for (let i = 1; i <= 12; i++) {
      let size: 'S' | 'M' | 'L' = 'S';
      let status: 'AVAILABLE' | 'OCCUPIED_RENTAL' = 'AVAILABLE';
      let itemDetected = 0;
      let rfid = null;

      if (i >= 5 && i <= 8) size = 'M';
      if (i >= 9) size = 'L';

      if (i === 5) {
        status = 'OCCUPIED_RENTAL';
        itemDetected = 1;
        rfid = 'E2801192';
      } else if (i === 6) {
        status = 'OCCUPIED_RENTAL';
        itemDetected = 1;
        rfid = 'B490C731';
      } else if (i === 7) {
        status = 'OCCUPIED_RENTAL';
        itemDetected = 1;
        rfid = 'D388E912';
      } else if (i === 9) {
        status = 'OCCUPIED_RENTAL';
        itemDetected = 1;
        rfid = 'F122A045';
      }

      insertBox.run(i, config.cabinetId, size, status, itemDetected, null, rfid, now);
    }
  }

  // Seed Rental Items
  const itemRes = db.prepare(`SELECT count(*) as count FROM rental_items`).get() as any;
  const itemCount = itemRes ? itemRes.count : 0;
  if (itemCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO rental_items (id, name, description, category, image_url, box_id, hourly_rate, deposit_amount, status, rfid_uid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)
    `);

    insertItem.run(
      'ITEM_BOSCH_DRILL',
      'Máy khoan pin Bosch GSB 120-LI (Kèm 2 pin + bộ mũi khoan đa năng)',
      'Khoan tường, bắt vít, công suất mạnh mẽ, phù hợp sửa chữa gia đình tiện lợi.',
      'Dụng cụ cầm tay',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
      5,
      35000,
      500000,
      'E2801192'
    );

    insertItem.run(
      'ITEM_PICKLEBALL_SET',
      'Bộ 2 Vợt Pickleball Franklin Carbon Pro + 4 bóng thi đấu chuẩn USAPA',
      'Mặt vợt sợi carbon trợ lực êm ái, báng cầm chống trượt, giải trí thể thao cư dân.',
      'Thể thao & Dã ngoại',
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80',
      6,
      25000,
      300000,
      'B490C731'
    );

    insertItem.run(
      'ITEM_CAR_JUMPSTARTER',
      'Bộ kích bình ắc quy ô tô khẩn cấp Baseus Super Energy Pro 12000mAh',
      'Kích bình ô tô máy xăng/dầu tức thì khi hết điện, tích hợp đèn pin và sạc nhanh dự phòng.',
      'Phụ kiện ô tô',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
      7,
      30000,
      400000,
      'D388E912'
    );

    insertItem.run(
      'ITEM_PRESSURE_WASHER',
      'Máy rửa xe cao áp Dekton 2800W áp lực 150 bar (Dây áp lực 12m)',
      'Xịt rửa xe máy, ô tô, vệ sinh sàn ban công, máy lạnh công suất mạnh mẽ.',
      'Thiết bị vệ sinh',
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
      9,
      50000,
      800000,
      'F122A045'
    );
  }

  // Seed sample resident parcel
  const parcelRes = db.prepare(`SELECT count(*) as count FROM parcels`).get() as any;
  const parcelCount = parcelRes ? parcelRes.count : 0;
  if (parcelCount === 0) {
    db.prepare(`
      INSERT INTO parcels (id, cabinet_id, box_id, recipient_phone, shipper_phone, pin_code, size, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_LOCKER', ?)
    `).run(
      'PARCEL_DEMO_01',
      config.cabinetId,
      2,
      '0912345678',
      '0988776655',
      '889922',
      'S',
      Date.now() - 3600000
    );

    db.prepare(`
      UPDATE boxes SET status = 'OCCUPIED_PARCEL', item_detected = 1, pin_code = '889922', current_order_id = 'PARCEL_DEMO_01'
      WHERE box_id = 2
    `).run();
  }

  saveDb();
}
