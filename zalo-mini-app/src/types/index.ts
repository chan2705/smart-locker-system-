export type BoxSize = 'S' | 'M' | 'L';
export type BoxStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED_PARCEL' | 'OCCUPIED_RENTAL' | 'ERROR_JAMMED' | 'TAMPERED_ALERT';
export type DoorState = 'OPENED' | 'CLOSED';

export interface LockerBox {
  box_id: number;
  cabinet_id: string;
  size: BoxSize;
  status: BoxStatus;
  door_state: DoorState;
  item_detected: number;
  pin_code?: string;
  current_order_id?: string;
  rfid_uid?: string;
  updated_at: number;
  rental_item_name?: string;
  hourly_rate?: number;
  deposit_amount?: number;
}

export interface Cabinet {
  id: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE';
  last_heartbeat?: number;
}

export interface Parcel {
  id: string;
  cabinet_id: string;
  box_id: number;
  recipient_phone: string;
  shipper_phone: string;
  pin_code: string;
  size: BoxSize;
  status: 'PENDING_DROPOFF' | 'IN_LOCKER' | 'COLLECTED' | 'CANCELLED';
  created_at: number;
  collected_at?: number;
}

export interface RentalItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  box_id: number;
  hourly_rate: number;
  deposit_amount: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  rfid_uid: string;
}

export interface VietQrData {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrImageUrl: string;
}

export interface RentalOrder {
  id: string;
  item_id: string;
  box_id: number;
  user_phone: string;
  user_name: string;
  id_card_no: string;
  deposit_amount: number;
  deposit_status: 'PENDING' | 'PAID' | 'REFUNDED';
  order_status: 'RESERVED' | 'ACTIVE' | 'RETURN_PENDING' | 'COMPLETED' | 'CANCELLED';
  start_time?: number;
  end_time?: number;
  pin_code: string;
  tx_hash?: string;
  created_at: number;
  item_name?: string;
  image_url?: string;
  hourly_rate?: number;
  vietQr?: VietQrData;
}

export interface EkycProfile {
  fullName: string;
  idCardNo: string;
  phone: string;
  livenessScore: number;
  verified: boolean;
}

export interface QrDeeplinkParams {
  cab: string;
  ts: number;
  nonce?: number;
  sig: string;
  isValid?: boolean;
}

export interface AuthSession {
  token: string;
  user: {
    userId: string;
    phone: string;
    name: string;
  };
}
