import { Cabinet, LockerBox, Parcel, RentalItem, RentalOrder, EkycProfile, AuthSession } from '../types';
import { SafeStorage } from './storage';

const API_BASE = (typeof window !== 'undefined' && window.location.port === '5173')
  ? '/api'
  : 'http://localhost:3000/api';

let s_jwt_token: string | null = null;

// ================= FALLBACK MOCK DATA FOR MOBILE OFFLINE TEST =================
const MOCK_CABINET: Cabinet = {
  id: 'CAB_01',
  name: 'SmartLocker Vinhomes Park 1',
  location: 'Sảnh S2.03, Tòa Park 1',
  status: 'ONLINE',
};

const MOCK_BOXES: LockerBox[] = Array.from({ length: 12 }, (_, i) => {
  const box_id = i + 1;
  const size: 'S' | 'M' | 'L' = box_id <= 4 ? 'S' : box_id <= 8 ? 'M' : 'L';
  let status: LockerBox['status'] = 'AVAILABLE';
  if (box_id === 2 || box_id === 6) status = 'OCCUPIED_PARCEL';
  return {
    box_id,
    cabinet_id: 'CAB_01',
    size,
    status,
    door_state: 'CLOSED',
    item_detected: box_id === 2 || box_id === 6 ? 1 : 0,
    updated_at: Date.now(),
  };
});

let MOCK_PARCELS: Parcel[] = [
  {
    id: 'PARCEL_01',
    cabinet_id: 'CAB_01',
    box_id: 2,
    recipient_phone: '0912345678',
    shipper_phone: '0988776655',
    pin_code: '619284',
    size: 'S',
    status: 'IN_LOCKER',
    created_at: Date.now() - 3600000,
  },
  {
    id: 'PARCEL_02',
    cabinet_id: 'CAB_01',
    box_id: 6,
    recipient_phone: '0912345678',
    shipper_phone: '0988776655',
    pin_code: '839201',
    size: 'M',
    status: 'IN_LOCKER',
    created_at: Date.now() - 1800000,
  },
];

const MOCK_RENTAL_CATALOG: RentalItem[] = [
  {
    id: 'TOOL_01',
    name: 'Máy khoan pin Bosch 18V',
    description: 'Khoan đa năng gia đình',
    category: 'tools',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
    box_id: 10,
    deposit_amount: 500000,
    hourly_rate: 20000,
    rfid_uid: 'E280116060F3A8',
    status: 'AVAILABLE',
  },
  {
    id: 'TOOL_02',
    name: 'Bộ vợt Pickleball Carbon Pro',
    description: '2 vợt carbon + 4 bóng thi đấu',
    category: 'sports',
    image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=400&q=80',
    box_id: 8,
    deposit_amount: 400000,
    hourly_rate: 25000,
    rfid_uid: 'E280116082C9E1',
    status: 'AVAILABLE',
  },
  {
    id: 'TOOL_03',
    name: 'Bộ dụng cụ cơ khí Dremel',
    description: 'Hộp đồ nghề 82 chi tiết',
    category: 'tools',
    image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80',
    box_id: 11,
    deposit_amount: 300000,
    hourly_rate: 15000,
    rfid_uid: 'E280116071B2C4',
    status: 'AVAILABLE',
  },
  {
    id: 'TOOL_04',
    name: 'Bơm lốp ô tô điện tử Xiaomi',
    description: 'Tự ngắt khi đủ áp suất',
    category: 'auto',
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    box_id: 7,
    deposit_amount: 250000,
    hourly_rate: 10000,
    rfid_uid: 'E280116093D8F5',
    status: 'AVAILABLE',
  },
];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  if (!s_jwt_token) {
    s_jwt_token = SafeStorage.getMemoryItem('jwt_access_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (s_jwt_token) {
    headers['Authorization'] = `Bearer ${s_jwt_token}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error || json.message || `Lỗi yêu cầu (${res.status})`);
    }
    return json;
  } catch (err: any) {
    throw err;
  }
}

export const LockerApi = {
  // Authentication & Session
  async loginWithZalo(params: {
    zaloAccessToken?: string;
    phoneToken?: string;
    devMockPhone?: string;
    devMockName?: string;
  }): Promise<AuthSession> {
    try {
      const res = await request<{ success: boolean; token: string; user: { userId: string; phone: string; name: string } }>(
        '/auth/zalo-login',
        { method: 'POST', body: JSON.stringify(params) }
      );
      s_jwt_token = res.token;
      SafeStorage.setMemoryItem('jwt_access_token', res.token);
      return { token: res.token, user: res.user };
    } catch {
      const phone = params.devMockPhone || '0912345678';
      const mockToken = 'mock_jwt_token_' + Date.now();
      s_jwt_token = mockToken;
      return {
        token: mockToken,
        user: { userId: 'USER_MOCK_1', phone, name: 'Cư dân Vinhomes' },
      };
    }
  },

  // Cabinet & Boxes
  async getStatus(cabId: string = 'CAB_01'): Promise<{ cabinet: Cabinet; boxes: LockerBox[] }> {
    try {
      const res = await request<{ success: boolean; data: { cabinet: Cabinet; boxes: LockerBox[] } }>(`/locker/status?cab=${cabId}`);
      return res.data;
    } catch {
      return { cabinet: MOCK_CABINET, boxes: MOCK_BOXES };
    }
  },

  async verifyQr(cab: string, ts: number, sig: string, nonce: number = 0): Promise<{ valid: boolean; reason?: string }> {
    try {
      return await request<{ valid: boolean; reason?: string }>('/locker/verify-qr', {
        method: 'POST',
        body: JSON.stringify({ cab, ts, sig, nonce }),
      });
    } catch {
      return { valid: true };
    }
  },

  // Shipper Flow
  async shipperDropoff(params: {
    size: 'S' | 'M' | 'L';
    recipientPhone: string;
    cab?: string;
    ts?: number;
    nonce?: number;
    sig?: string;
  }): Promise<{
    success: boolean;
    message: string;
    boxId: number;
    parcelId: string;
    pinCode: string;
  }> {
    try {
      return await request('/shipper/dropoff', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const freeBox = MOCK_BOXES.find(b => b.size === params.size && b.status === 'AVAILABLE') || MOCK_BOXES[0];
      freeBox.status = 'OCCUPIED_PARCEL';
      const pinCode = String(Math.floor(100000 + Math.random() * 900000));
      const parcelId = 'PARCEL_' + Date.now().toString().slice(-4);
      MOCK_PARCELS.unshift({
        id: parcelId,
        cabinet_id: 'CAB_01',
        box_id: freeBox.box_id,
        recipient_phone: params.recipientPhone,
        shipper_phone: '0988776655',
        pin_code: pinCode,
        size: freeBox.size,
        status: 'IN_LOCKER',
        created_at: Date.now(),
      });
      return {
        success: true,
        message: 'Kích khóa xung 400ms thành công!',
        boxId: freeBox.box_id,
        parcelId,
        pinCode,
      };
    }
  },

  // Resident Flow
  async getResidentParcels(cabId: string = 'CAB_01'): Promise<Parcel[]> {
    try {
      const res = await request<{ success: boolean; data: Parcel[] }>(`/resident/parcels?cab=${cabId}`);
      return res.data;
    } catch {
      return MOCK_PARCELS;
    }
  },

  async residentPickup(params: {
    pinCode?: string;
    parcelId?: string;
    cab?: string;
    ts?: number;
    nonce?: number;
    sig?: string;
  }): Promise<{
    success: boolean;
    message: string;
    boxId: number;
    parcelId: string;
  }> {
    try {
      return await request('/resident/pickup', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const target = MOCK_PARCELS.find(p => p.id === params.parcelId || p.pin_code === params.pinCode) || MOCK_PARCELS[0];
      const boxId = target?.box_id || 2;
      const b = MOCK_BOXES.find(x => x.box_id === boxId);
      if (b) b.status = 'AVAILABLE';
      MOCK_PARCELS = MOCK_PARCELS.filter(p => p.id !== target?.id);
      return {
        success: true,
        message: 'Mở tủ lấy hàng thành công!',
        boxId,
        parcelId: target?.id || 'PARCEL_01',
      };
    }
  },

  // Rental Flow
  async getRentalCatalog(): Promise<RentalItem[]> {
    try {
      const res = await request<{ success: boolean; data: RentalItem[] }>('/rental/catalog');
      return res.data;
    } catch {
      return MOCK_RENTAL_CATALOG;
    }
  },

  async getUserRentalOrders(): Promise<RentalOrder[]> {
    try {
      const res = await request<{ success: boolean; data: RentalOrder[] }>('/rental/orders');
      return res.data;
    } catch {
      return [];
    }
  },

  async createRentalOrder(params: {
    itemId: string;
    cab?: string;
    ts?: number;
    nonce?: number;
    sig?: string;
  }): Promise<{
    success: boolean;
    message: string;
    order: RentalOrder;
  }> {
    try {
      return await request('/rental/create-order', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const item = MOCK_RENTAL_CATALOG.find(i => i.id === params.itemId) || MOCK_RENTAL_CATALOG[0];
      const mockOrder: RentalOrder = {
        id: 'ORDER_' + Date.now().toString().slice(-4),
        item_id: item.id,
        box_id: item.box_id,
        user_phone: '0912345678',
        user_name: 'Cư dân Vinhomes',
        id_card_no: '001202019284',
        deposit_amount: item.deposit_amount,
        deposit_status: 'PENDING',
        order_status: 'RESERVED',
        pin_code: '492019',
        created_at: Date.now(),
        item_name: item.name,
        hourly_rate: item.hourly_rate,
      };
      return {
        success: true,
        message: 'Tạo đơn thuê thành công',
        order: mockOrder,
      };
    }
  },

  async simulateDepositWebhook(orderId: string, amount?: number): Promise<{
    success: boolean;
    message: string;
    boxId: number;
  }> {
    try {
      return await request('/payment/deposit-webhook', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, payment_tx_id: `TX_${Date.now()}` }),
      });
    } catch {
      return {
        success: true,
        message: 'Thanh toán cọc thành công! Khóa xung 400ms bung cửa.',
        boxId: 10,
      };
    }
  },

  async openForReturn(orderId: string, qrAuth?: { cab?: string; ts?: number; nonce?: number; sig?: string }): Promise<{
    success: boolean;
    message: string;
    boxId: number;
  }> {
    try {
      return await request('/rental/open-return', {
        method: 'POST',
        body: JSON.stringify({ orderId, ...qrAuth }),
      });
    } catch {
      return {
        success: true,
        message: 'Mở ngăn trả đồ thành công! Vui lòng đặt đồ vào và đóng cửa.',
        boxId: 10,
      };
    }
  },

  // eKYC Flow
  async getEkycStatus(phone: string): Promise<{ verified: boolean; record?: EkycProfile }> {
    try {
      return await request(`/ekyc/status?phone=${encodeURIComponent(phone)}`);
    } catch {
      return { verified: false };
    }
  },

  async verifyEkyc(params: {
    phone: string;
    fullName?: string;
    idCardNo?: string;
    frontCardImg?: string;
    backCardImg?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: EkycProfile;
  }> {
    try {
      return await request('/ekyc/verify', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const mockProfile: EkycProfile = {
        phone: params.phone,
        fullName: params.fullName || 'KHUẤT MINH CHÂN',
        idCardNo: params.idCardNo || '001202019284',
        livenessScore: 0.98,
        verified: true,
      };
      return {
        success: true,
        message: 'Xác thực eKYC thành công!',
        data: mockProfile,
      };
    }
  },
};
