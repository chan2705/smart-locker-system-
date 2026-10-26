import { create } from 'zustand';
import { Cabinet, LockerBox, Parcel, RentalItem, RentalOrder, EkycProfile, QrDeeplinkParams } from '../types';
import { LockerApi } from '../services/api';
import { SafeStorage } from '../services/storage';

export type AppTab = 'shipper' | 'resident' | 'rental';

interface AppState {
  currentTab: AppTab;
  authToken: string | null;
  userPhone: string;
  shipperPhone: string;
  qrParams: QrDeeplinkParams | null;
  cabinet: Cabinet | null;
  boxes: LockerBox[];
  residentParcels: Parcel[];
  rentalCatalog: RentalItem[];
  userRentalOrders: RentalOrder[];
  ekycProfile: EkycProfile | null;
  isLoading: boolean;
  error: string | null;

  isEkycModalOpen: boolean;
  isVietQrModalOpen: boolean;
  activeRentalOrder: RentalOrder | null;
  unlockSuccessModal: {
    isOpen: boolean;
    title: string;
    message: string;
    boxId: number;
    pinCode?: string;
  } | null;

  // Actions
  login: (phoneOverride?: string) => Promise<void>;
  setCurrentTab: (tab: AppTab) => void;
  setUserPhone: (phone: string) => void;
  setShipperPhone: (phone: string) => void;
  setQrParams: (params: QrDeeplinkParams | null) => void;
  fetchCabinetStatus: () => Promise<void>;
  fetchResidentParcels: () => Promise<void>;
  fetchRentalCatalog: () => Promise<void>;
  fetchUserRentalOrders: () => Promise<void>;
  checkEkycStatus: () => Promise<boolean>;
  openUnlockModal: (data: { title: string; message: string; boxId: number; pinCode?: string }) => void;
  closeUnlockModal: () => void;
  setEkycModalOpen: (open: boolean) => void;
  setVietQrModalOpen: (open: boolean, order?: RentalOrder) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'resident',
  authToken: null,
  userPhone: '0912345678',
  shipperPhone: '0988776655',
  qrParams: null,
  cabinet: null,
  boxes: [],
  residentParcels: [],
  rentalCatalog: [],
  userRentalOrders: [],
  ekycProfile: null,
  isLoading: false,
  error: null,

  isEkycModalOpen: false,
  isVietQrModalOpen: false,
  activeRentalOrder: null,
  unlockSuccessModal: null,

  login: async (phoneOverride?: string) => {
    try {
      const phone = phoneOverride || get().userPhone;
      const session = await LockerApi.loginWithZalo({ devMockPhone: phone });
      set({ authToken: session.token, userPhone: session.user.phone });
      await get().fetchResidentParcels();
      await get().checkEkycStatus();
      await get().fetchUserRentalOrders();
    } catch (err: any) {
      console.warn('Authentication error:', err.message);
    }
  },

  setCurrentTab: (tab) => {
    // When switching to shipper tab, re-authenticate with shipper identity
    if (tab === 'shipper') {
      get().login(get().shipperPhone);
    } else {
      get().login(get().userPhone);
    }
    set({ currentTab: tab });
  },
  
  setUserPhone: (phone) => {
    SafeStorage.setMemoryItem('user_phone', phone);
    set({ userPhone: phone });
    get().login(phone);
  },

  setShipperPhone: (phone) => {
    SafeStorage.setMemoryItem('shipper_phone', phone);
    set({ shipperPhone: phone });
  },

  setQrParams: (params) => set({ qrParams: params }),

  fetchCabinetStatus: async () => {
    try {
      const cabId = get().qrParams?.cab || 'CAB_01';
      const res = await LockerApi.getStatus(cabId);
      set({ cabinet: res.cabinet, boxes: res.boxes });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchResidentParcels: async () => {
    try {
      const cabId = get().qrParams?.cab || 'CAB_01';
      const parcels = await LockerApi.getResidentParcels(cabId);
      set({ residentParcels: parcels });
    } catch (err: any) {
      console.warn('Failed to fetch resident parcels:', err.message);
    }
  },

  fetchRentalCatalog: async () => {
    try {
      const catalog = await LockerApi.getRentalCatalog();
      set({ rentalCatalog: catalog });
    } catch (err: any) {
      console.warn('Failed to fetch rental catalog:', err.message);
    }
  },

  fetchUserRentalOrders: async () => {
    try {
      const orders = await LockerApi.getUserRentalOrders();
      set({ userRentalOrders: orders });
    } catch (err: any) {
      console.warn('Failed to fetch user rental orders:', err.message);
    }
  },

  checkEkycStatus: async () => {
    const phone = get().userPhone;
    if (!phone) return false;
    try {
      const res = await LockerApi.getEkycStatus(phone);
      if (res.verified && res.record) {
        set({ ekycProfile: res.record });
        return true;
      } else {
        set({ ekycProfile: null });
        return false;
      }
    } catch (err) {
      set({ ekycProfile: null });
      return false;
    }
  },

  openUnlockModal: (data) => set({
    unlockSuccessModal: { isOpen: true, ...data }
  }),

  closeUnlockModal: () => set({ unlockSuccessModal: null }),

  setEkycModalOpen: (open) => set({ isEkycModalOpen: open }),

  setVietQrModalOpen: (open, order) => set({
    isVietQrModalOpen: open,
    activeRentalOrder: order || null,
  }),
}));
