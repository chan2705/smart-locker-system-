import React, { useState } from 'react';
import {
  Smartphone,
  Palette,
  SunMoon,
  RotateCcw,
  PackagePlus,
  PackageCheck,
  Wrench,
  Unlock,
  Phone,
  Shuffle,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ScanLine,
  CreditCard,
  BellRing,
  Sparkles,
  X,
} from 'lucide-react';

type BoxSize = 'S' | 'M' | 'L';
type AppTab = 'shipper' | 'resident' | 'rental';
type ColorTheme = 'blue' | 'emerald' | 'violet' | 'orange';

interface ParcelInfo {
  phone: string;
  trackingCode: string;
  last4: string;
}

interface DeliveryBox {
  id: number;
  size: BoxSize;
  status: 'AVAILABLE' | 'OCCUPIED';
  parcel: ParcelInfo | null;
}

interface RentalToolItem {
  id: string;
  boxId: number;
  name: string;
  svgKey: string;
  pricePerBlock: number;
  status: 'AVAILABLE' | 'RENTED';
  blocks: number;
}

interface CustomerMsg {
  phone: string;
  type: 'SHIPPER' | 'RENTAL';
  title: string;
  bodyText: string;
  highlightCode?: string;
  timeStr: string;
}

const THEME_CONFIG: Record<
  ColorTheme,
  {
    name: string;
    primaryBg: string;
    primaryText: string;
    primaryBorder: string;
    lightBg: string;
    dotColor: string;
  }
> = {
  blue: {
    name: 'Xanh Zalo',
    primaryBg: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-600',
    lightBg: 'bg-blue-50 border-blue-200',
    dotColor: 'bg-blue-600',
  },
  emerald: {
    name: 'Xanh Ngọc Eco',
    primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryBorder: 'border-emerald-600',
    lightBg: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-600',
  },
  violet: {
    name: 'Tím Công Nghệ',
    primaryBg: 'bg-violet-600 hover:bg-violet-700',
    primaryText: 'text-violet-600',
    primaryBorder: 'border-violet-600',
    lightBg: 'bg-violet-50 border-violet-200',
    dotColor: 'bg-violet-600',
  },
  orange: {
    name: 'Cam Năng Động',
    primaryBg: 'bg-orange-600 hover:bg-orange-700',
    primaryText: 'text-orange-600',
    primaryBorder: 'border-orange-600',
    lightBg: 'bg-orange-50 border-orange-200',
    dotColor: 'bg-orange-600',
  },
};

const INITIAL_DELIVERY_BOXES: DeliveryBox[] = [
  { id: 1, size: 'S', status: 'AVAILABLE', parcel: null },
  { id: 2, size: 'S', status: 'AVAILABLE', parcel: null },
  { id: 3, size: 'M', status: 'AVAILABLE', parcel: null },
  { id: 4, size: 'M', status: 'AVAILABLE', parcel: null },
  { id: 5, size: 'L', status: 'AVAILABLE', parcel: null },
  { id: 6, size: 'L', status: 'AVAILABLE', parcel: null },
];

const INITIAL_RENTAL_ITEMS: RentalToolItem[] = [
  { id: 'tool_1', boxId: 7, name: 'Máy Cắt Tay', svgKey: 'hand_cutter', pricePerBlock: 30000, status: 'AVAILABLE', blocks: 0 },
  { id: 'tool_2', boxId: 8, name: 'Máy Hút Bụi', svgKey: 'vacuum_cleaner', pricePerBlock: 35000, status: 'AVAILABLE', blocks: 0 },
  { id: 'tool_3', boxId: 9, name: 'Máy In Laser', svgKey: 'printer', pricePerBlock: 40000, status: 'AVAILABLE', blocks: 0 },
  { id: 'tool_4', boxId: 10, name: 'Máy Chiếu HD', svgKey: 'projector', pricePerBlock: 60000, status: 'AVAILABLE', blocks: 0 },
  { id: 'tool_5', boxId: 11, name: 'Máy Khoan Pin', svgKey: 'power_drill', pricePerBlock: 30000, status: 'AVAILABLE', blocks: 0 },
  { id: 'tool_6', boxId: 12, name: 'Máy Rửa Xe Mini', svgKey: 'pressure_washer', pricePerBlock: 45000, status: 'AVAILABLE', blocks: 0 },
];

const RealisticToolIcon: React.FC<{ svgKey: string }> = ({ svgKey }) => {
  switch (svgKey) {
    case 'hand_cutter':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <circle cx="20" cy="32" r="15" fill="#CBD5E1" stroke="#475569" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="20" cy="32" r="4" fill="#334155" />
          <path d="M20 14 A18 18 0 0 1 36 40 L26 36 Z" fill="#334155" opacity="0.85" />
          <rect x="26" y="24" width="28" height="16" rx="5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
          <path d="M30 24 L27 12 L33 12 L34 24 Z" fill="#1E293B" />
        </svg>
      );
    case 'vacuum_cleaner':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="8" y="50" width="26" height="7" rx="3.5" fill="#1E293B" />
          <path d="M21 50 L37 26" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="33" y="12" width="14" height="18" rx="4" transform="rotate(25 40 21)" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
          <path d="M44 12 L54 18 L48 28 L42 24" fill="none" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'printer':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="18" y="7" width="28" height="16" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="8" y="20" width="48" height="26" rx="6" fill="#334155" />
          <rect x="18" y="40" width="28" height="17" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="22" y1="46" x2="40" y2="46" stroke="#2563EB" strokeWidth="2" />
          <line x1="22" y1="51" x2="36" y2="51" stroke="#64748B" strokeWidth="2" />
        </svg>
      );
    case 'projector':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <path d="M24 44 L18 55 M40 44 L46 55 M32 44 L32 56" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <rect x="8" y="20" width="48" height="24" rx="7" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
          <circle cx="41" cy="32" r="10" fill="#1E293B" />
          <circle cx="41" cy="32" r="6" fill="#2563EB" />
          <circle cx="39" cy="30" r="2" fill="#FFFFFF" />
        </svg>
      );
    case 'power_drill':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <path d="M6 23 L18 23" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          <polygon points="18,19 25,17 25,29 18,27" fill="#334155" />
          <rect x="25" y="15" width="27" height="16" rx="4" fill="#0284C7" />
          <path d="M36 31 L32 47 L42 47 L45 31 Z" fill="#0284C7" />
          <rect x="28" y="47" width="18" height="9" rx="3" fill="#1E293B" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <path d="M22 16 L22 9 L38 9 L38 16" fill="none" stroke="#1E293B" strokeWidth="3.5" />
          <rect x="16" y="16" width="28" height="34" rx="6" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="30" cy="29" r="5" fill="#1E293B" />
          <circle cx="18" cy="50" r="5" fill="#0F172A" />
          <circle cx="42" cy="50" r="5" fill="#0F172A" />
        </svg>
      );
  }
};

export const App: React.FC = () => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const [darkSurface, setDarkSurface] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>('shipper');

  const [deliveryBoxes, setDeliveryBoxes] = useState<DeliveryBox[]>(INITIAL_DELIVERY_BOXES);
  const [rentalItems, setRentalItems] = useState<RentalToolItem[]>(INITIAL_RENTAL_ITEMS);

  // Shipper form state
  const [selectedSize, setSelectedSize] = useState<BoxSize>('S');
  const [recipientPhone, setRecipientPhone] = useState('0912345678');
  const [trackingCode, setTrackingCode] = useState('SPX-6829');
  const [shipperError, setShipperError] = useState<string | null>(null);

  // Resident pickup state
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupTracking, setPickupTracking] = useState('');
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Door modal state
  const [doorSimModal, setDoorSimModal] = useState<{
    mode: 'SHIPPER_DROP' | 'RESIDENT_PICKUP';
    boxId: number;
    boxSize: BoxSize;
    phone: string;
    trackingCode: string;
    last4: string;
    isClosing: boolean;
  } | null>(null);

  // Rental modal state
  const [rentalSession, setRentalSession] = useState<{
    item: RentalToolItem;
    blocks: number;
    phone: string;
    step: 1 | 2 | 3 | 4;
    isSpinning: boolean;
    isStepDone: boolean;
  } | null>(null);

  // 1/2 Customer Notification Phone State
  const [customerPhoneOwner, setCustomerPhoneOwner] = useState<string>('Chưa xác định');
  const [clearReason, setClearReason] = useState<string>('Màn hình sẵn sàng nhận thông báo mới');
  const [customerMsg, setCustomerMsg] = useState<CustomerMsg | null>(null);

  const theme = THEME_CONFIG[colorTheme];

  const freeDeliveryAll = deliveryBoxes.filter((b) => b.status === 'AVAILABLE').length;
  const occupiedDeliveryAll = deliveryBoxes.filter((b) => b.status === 'OCCUPIED').length;
  const freeS = deliveryBoxes.filter((b) => b.size === 'S' && b.status === 'AVAILABLE').length;
  const freeM = deliveryBoxes.filter((b) => b.size === 'M' && b.status === 'AVAILABLE').length;
  const freeL = deliveryBoxes.filter((b) => b.size === 'L' && b.status === 'AVAILABLE').length;
  const availRentals = rentalItems.filter((r) => r.status === 'AVAILABLE').length;

  const cycleTheme = () => {
    const order: ColorTheme[] = ['blue', 'emerald', 'violet', 'orange'];
    const idx = order.indexOf(colorTheme);
    setColorTheme(order[(idx + 1) % order.length]);
  };

  const wipeCustomerMiniPhone = (reason: string, phone?: string) => {
    setCustomerMsg(null);
    setClearReason(reason);
    if (phone) setCustomerPhoneOwner(phone);
  };

  const handleShipperDropoff = () => {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('0') || (cleanPhone.length !== 10 && cleanPhone.length !== 11)) {
      setShipperError('Vui lòng nhập số điện thoại hợp lệ (10-11 số, bắt đầu bằng 0)!');
      return;
    }
    setShipperError(null);

    const targetBox =
      deliveryBoxes.find((b) => b.size === selectedSize && b.status === 'AVAILABLE') ||
      deliveryBoxes.find((b) => b.status === 'AVAILABLE');

    if (!targetBox) {
      setShipperError('Tất cả 6 ngăn gửi hàng đều đã đầy!');
      return;
    }

    const digits = trackingCode.replace(/[^0-9]/g, '');
    const last4 = digits.length >= 4 ? digits.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
    const finalTracking = digits.length >= 4 ? trackingCode.toUpperCase() : `SPX-${last4}`;

    // Xóa trắng giao diện màn hình 1/2 khi bấm gửi đồ
    wipeCustomerMiniPhone(`Đang gửi hàng mới cho SĐT ${cleanPhone}`, cleanPhone);

    setDoorSimModal({
      mode: 'SHIPPER_DROP',
      boxId: targetBox.id,
      boxSize: targetBox.size,
      phone: cleanPhone,
      trackingCode: finalTracking,
      last4,
      isClosing: false,
    });
  };

  const confirmCloseDoorModal = () => {
    if (!doorSimModal) return;
    setDoorSimModal({ ...doorSimModal, isClosing: true });

    setTimeout(() => {
      if (doorSimModal.mode === 'SHIPPER_DROP') {
        setDeliveryBoxes((prev) =>
          prev.map((b) =>
            b.id === doorSimModal.boxId
              ? {
                  ...b,
                  status: 'OCCUPIED',
                  parcel: {
                    phone: doorSimModal.phone,
                    trackingCode: doorSimModal.trackingCode,
                    last4: doorSimModal.last4,
                  },
                }
              : b
          )
        );

        const now = new Date();
        setCustomerMsg({
          phone: doorSimModal.phone,
          type: 'SHIPPER',
          title: 'Thông Báo Đơn Hàng Mới',
          bodyText: `Bạn có 1 đơn hàng shopper mã vận đơn 4 số cuối là ${doorSimModal.last4} (Tại Ngăn #0${doorSimModal.boxId}).`,
          highlightCode: doorSimModal.last4,
          timeStr: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });

        setTrackingCode(`SPX-${Math.floor(1000 + Math.random() * 9000)}`);
      } else {
        setDeliveryBoxes((prev) =>
          prev.map((b) => (b.id === doorSimModal.boxId ? { ...b, status: 'AVAILABLE', parcel: null } : b))
        );
        setPickupPhone('');
        setPickupTracking('');
      }
      setDoorSimModal(null);
    }, 550);
  };

  const handleResidentPickup = () => {
    const cleanPhone = pickupPhone.replace(/[^0-9]/g, '');
    const cleanCode = pickupTracking.trim().toUpperCase();

    const matchedBox = deliveryBoxes.find(
      (b) =>
        b.status === 'OCCUPIED' &&
        b.parcel &&
        b.parcel.phone === cleanPhone &&
        (b.parcel.last4 === cleanCode || b.parcel.trackingCode.toUpperCase() === cleanCode)
    );

    if (!matchedBox || !matchedBox.parcel) {
      setPickupError('Không tìm thấy đơn hàng khớp với SĐT và Mã vận đơn 4 số cuối này!');
      return;
    }

    setPickupError(null);
    setDoorSimModal({
      mode: 'RESIDENT_PICKUP',
      boxId: matchedBox.id,
      boxSize: matchedBox.size,
      phone: matchedBox.parcel.phone,
      trackingCode: matchedBox.parcel.trackingCode,
      last4: matchedBox.parcel.last4,
      isClosing: false,
    });
  };

  const startRentItem = (item: RentalToolItem) => {
    // Xóa trắng giao diện 1/2 mỗi khi bấm thuê đồ
    wipeCustomerMiniPhone(`Khách hàng mới chọn thuê ${item.name}`, '0912345678');
    setRentalSession({
      item,
      blocks: 1,
      phone: '0912345678',
      step: 1,
      isSpinning: false,
      isStepDone: false,
    });
  };

  const triggerRentalAuth = () => {
    if (!rentalSession) return;
    setRentalSession({ ...rentalSession, isSpinning: true });
    setTimeout(() => {
      setRentalSession((prev) => (prev ? { ...prev, isSpinning: false, isStepDone: true } : null));
      setTimeout(() => {
        setRentalSession((prev) => (prev ? { ...prev, step: 3, isSpinning: false, isStepDone: false } : null));
      }, 650);
    }, 1000);
  };

  const triggerRentalPayment = () => {
    if (!rentalSession) return;
    setRentalSession({ ...rentalSession, isSpinning: true });
    setTimeout(() => {
      setRentalSession((prev) => (prev ? { ...prev, isSpinning: false, isStepDone: true } : null));
      setTimeout(() => {
        setRentalSession((prev) => (prev ? { ...prev, step: 4, isSpinning: false, isStepDone: false } : null));
      }, 650);
    }, 1000);
  };

  const finishRentalDoorClose = () => {
    if (!rentalSession) return;
    const { item, blocks, phone } = rentalSession;
    const totalHours = blocks * 3;
    const totalPrice = blocks * item.pricePerBlock;

    setRentalItems((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: 'RENTED', blocks } : r))
    );

    const now = new Date();
    setCustomerPhoneOwner(phone);
    setCustomerMsg({
      phone,
      type: 'RENTAL',
      title: 'Xác Nhận Thuê Thiết Bị',
      bodyText: `Bạn đã thuê thành công ${item.name} (Ngăn #${String(item.boxId).padStart(2, '0')}) trong ${blocks} block (${totalHours} giờ). Tổng thanh toán: ${totalPrice.toLocaleString('vi-VN')}đ.`,
      timeStr: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    setRentalSession(null);
  };

  const returnRentalTool = (toolId: string) => {
    setRentalItems((prev) =>
      prev.map((r) => (r.id === toolId ? { ...r, status: 'AVAILABLE', blocks: 0 } : r))
    );
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors ${darkSurface ? 'bg-slate-900' : 'bg-slate-100'} text-slate-900`}>
      {/* TOP BAR */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-bold shadow`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900">SMART LOCKER • LIVE DEMO</h1>
              <p className="text-[11px] text-slate-500 font-medium">Giao Diện Chính + Popup Tin Nhắn Khách Hàng (1/2)</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Nút 1: Chuyển màu giao diện */}
            <button
              onClick={cycleTheme}
              className={`${theme.primaryBg} text-white text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Đổi Màu: {theme.name}</span>
            </button>

            {/* Nút 2: Chuyển nền sáng/tối */}
            <button
              onClick={() => setDarkSurface(!darkSurface)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 active:scale-95 transition"
            >
              <SunMoon className="w-3.5 h-3.5" />
              <span>{darkSurface ? 'Nền Tối' : 'Nền Sáng'}</span>
            </button>

            <button
              onClick={() => {
                setDeliveryBoxes(INITIAL_DELIVERY_BOXES);
                setRentalItems(INITIAL_RENTAL_ITEMS);
                wipeCustomerMiniPhone('Đã reset toàn bộ hệ thống');
              }}
              className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN STAGE: MAIN PHONE + 1/2 MINI PHONE */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4">
        {/* 1. GIAO DIỆN CHÍNH */}
        <div className="w-[395px] h-[820px] bg-slate-900 rounded-[52px] p-2.5 shadow-2xl relative flex flex-col overflow-hidden border-2 border-slate-700">
          <div className="w-full h-full bg-slate-50 rounded-[44px] flex flex-col overflow-hidden relative border border-slate-200">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-black text-xs`}>
                  SL
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">SmartLocker</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    Trống {freeDeliveryAll}/6 ngăn gửi • Sẵn sàng {availRentals}/6 đồ thuê
                  </p>
                </div>
              </div>
              <button onClick={cycleTheme} className={`p-1.5 rounded-full border ${theme.lightBg} ${theme.primaryText}`}>
                <Palette className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-3.5">
              {currentTab === 'shipper' && (
                <div className="space-y-3.5">
                  <div className={`rounded-2xl p-3 border ${theme.lightBg} flex justify-between items-center`}>
                    <div>
                      <div className={`text-[10px] font-extrabold uppercase ${theme.primaryText}`}>Shipper Gửi Hàng</div>
                      <div className="text-sm font-extrabold text-slate-900">Mở Tủ Nhanh</div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className={`text-base font-black ${theme.primaryText}`}>{freeDeliveryAll}</span>
                        <span className="text-[10px] font-bold text-slate-500 block">trống</span>
                      </div>
                      <div>
                        <span className="text-base font-black text-amber-600">{occupiedDeliveryAll}</span>
                        <span className="text-[10px] font-bold text-slate-500 block">đang gửi</span>
                      </div>
                    </div>
                  </div>

                  {/* Size selector */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase block mb-1.5">1. Chọn cỡ ngăn tủ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { sz: 'S' as BoxSize, name: 'Cỡ Nhỏ', count: freeS },
                          { sz: 'M' as BoxSize, name: 'Cỡ Vừa', count: freeM },
                          { sz: 'L' as BoxSize, name: 'Cỡ Lớn', count: freeL },
                        ]
                      ).map((item) => (
                        <button
                          key={item.sz}
                          onClick={() => setSelectedSize(item.sz)}
                          className={`p-2.5 rounded-2xl border-2 text-center transition ${
                            selectedSize === item.sz ? `${theme.primaryBorder} ${theme.lightBg}` : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="text-xs font-extrabold text-slate-900">
                            {item.name} ({item.sz})
                          </div>
                          <div className={`text-xs font-bold mt-1 ${item.count === 0 ? 'text-rose-600' : theme.primaryText}`}>
                            Trống: {item.count}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase block mb-1">2. SĐT Khách Hàng</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm font-bold"
                        placeholder="Nhập SĐT khách hàng"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {/* Tracking code */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-extrabold text-slate-700 uppercase">3. Mã Vận Đơn</label>
                      <button
                        onClick={() => setTrackingCode(`SPX-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] font-bold text-slate-500 flex items-center gap-1"
                      >
                        <Shuffle className="w-3 h-3" /> Đổi mã
                      </button>
                    </div>
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm font-bold font-mono"
                    />
                  </div>

                  {shipperError && <div className="text-xs font-bold text-rose-600">{shipperError}</div>}

                  <button
                    onClick={handleShipperDropoff}
                    className={`w-full ${theme.primaryBg} text-white py-3.5 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2`}
                  >
                    <Unlock className="w-4 h-4" />
                    <span>GỬI HÀNG & MỞ TỦ NGAY</span>
                  </button>
                </div>
              )}

              {currentTab === 'resident' && (
                <div className="space-y-3.5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-emerald-700">Khách Hàng Nhận Đồ</div>
                      <div className="text-sm font-extrabold text-slate-900">Nhập SĐT & Mã Vận Đơn</div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600">{occupiedDeliveryAll}</span>
                      <span className="text-[10px] font-bold text-slate-500 block">đơn chờ</span>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 space-y-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">1. Số điện thoại của bạn</label>
                      <input
                        type="tel"
                        value={pickupPhone}
                        onChange={(e) => setPickupPhone(e.target.value)}
                        placeholder="Nhập SĐT nhận hàng"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">2. Mã vận đơn (4 số cuối)</label>
                      <input
                        type="text"
                        value={pickupTracking}
                        onChange={(e) => setPickupTracking(e.target.value)}
                        placeholder="Nhập 4 số cuối mã vận đơn"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-base font-black text-emerald-700 font-mono"
                      />
                    </div>

                    {pickupError && (
                      <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{pickupError}</span>
                      </div>
                    )}

                    <button
                      onClick={handleResidentPickup}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>XÁC THỰC & MỞ TỦ NHẬN HÀNG</span>
                    </button>
                  </div>

                  {/* Quick fill list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5">
                    <div className="text-[11px] font-extrabold text-slate-700 uppercase">Đơn đang lưu trong tủ</div>
                    {deliveryBoxes
                      .filter((b) => b.status === 'OCCUPIED' && b.parcel)
                      .map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setPickupPhone(b.parcel!.phone);
                            setPickupTracking(b.parcel!.last4);
                            setPickupError(null);
                          }}
                          className="cursor-pointer bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl p-2 flex justify-between items-center text-xs font-bold"
                        >
                          <span>
                            Ngăn #0{b.id} • SĐT: {b.parcel!.phone} (MVĐ: ...{b.parcel!.last4})
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Điền nhanh</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {currentTab === 'rental' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-amber-700">Thuê Đồ Tiện Ích</div>
                      <div className="text-sm font-extrabold text-slate-900">1 Block = 3 Giờ Sử Dụng</div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-600">{availRentals}/6</span>
                      <span className="text-[10px] font-bold text-slate-500 block">có sẵn</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {rentalItems.map((item) => (
                      <div key={item.id} className="bg-white border-2 border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1">
                              <RealisticToolIcon svgKey={item.svgKey} />
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                item.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status === 'AVAILABLE' ? 'Sẵn sàng' : `${item.blocks} Block`}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900">{item.name}</div>
                          <div className="text-[10px] font-bold text-amber-600">
                            {item.pricePerBlock.toLocaleString('vi-VN')}đ/block 3h • #{String(item.boxId).padStart(2, '0')}
                          </div>
                        </div>

                        {item.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => startRentItem(item)}
                            className={`w-full mt-2 ${theme.primaryBg} text-white py-2 rounded-xl font-extrabold text-xs`}
                          >
                            Thuê Ngay
                          </button>
                        ) : (
                          <button
                            onClick={() => returnRentalTool(item.id)}
                            className="w-full mt-2 bg-emerald-600 text-white py-2 rounded-xl font-extrabold text-xs"
                          >
                            Trả Đồ
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 z-40">
              <button
                onClick={() => {
                  setCurrentTab('shipper');
                  wipeCustomerMiniPhone('Chuyển sang chế độ Gửi Hàng (Khách hàng mới)');
                }}
                className={`flex-1 flex flex-col items-center py-1 ${currentTab === 'shipper' ? theme.primaryText : 'text-slate-400'}`}
              >
                <PackagePlus className="w-5 h-5" />
                <span className="text-[11px] font-extrabold mt-0.5">Gửi Hàng</span>
              </button>
              <button
                onClick={() => setCurrentTab('resident')}
                className={`flex-1 flex flex-col items-center py-1 relative ${currentTab === 'resident' ? theme.primaryText : 'text-slate-400'}`}
              >
                {occupiedDeliveryAll > 0 && (
                  <span className="absolute top-0 right-7 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                    {occupiedDeliveryAll}
                  </span>
                )}
                <PackageCheck className="w-5 h-5" />
                <span className="text-[11px] font-extrabold mt-0.5">Nhận Hàng</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('rental');
                  wipeCustomerMiniPhone('Chuyển sang chế độ Thuê Đồ (Khách hàng mới)');
                }}
                className={`flex-1 flex flex-col items-center py-1 ${currentTab === 'rental' ? theme.primaryText : 'text-slate-400'}`}
              >
                <Wrench className="w-5 h-5" />
                <span className="text-[11px] font-extrabold mt-0.5">Thuê Đồ</span>
              </button>
            </div>

            {/* DOOR SIMULATION MODAL */}
            {doorSimModal && (
              <div className="absolute inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-5 w-full text-center space-y-4 shadow-2xl">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    {doorSimModal.isClosing ? '🔒 Đã Đóng Tủ An Toàn' : '🔓 Cửa Tủ Đang Mở'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Ngăn #{String(doorSimModal.boxId).padStart(2, '0')} ({doorSimModal.boxSize})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {doorSimModal.mode === 'SHIPPER_DROP'
                      ? `Đặt đơn hàng [${doorSimModal.trackingCode}] vào tủ và bấm đóng cửa tủ.`
                      : `Khách hàng lấy đơn hàng [${doorSimModal.trackingCode}] và bấm đóng cửa tủ.`}
                  </p>
                  <button
                    onClick={confirmCloseDoorModal}
                    className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {doorSimModal.mode === 'SHIPPER_DROP' ? 'Đã Đặt Hàng & Đóng Cửa Tủ' : 'Đã Lấy Hàng & Đóng Cửa Tủ'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* RENTAL MODAL */}
            {rentalSession && (
              <div className="absolute inset-0 bg-slate-900/65 z-50 flex flex-col justify-end">
                <div className="bg-white rounded-t-3xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase text-slate-500">
                      Bước {rentalSession.step}/4 • Thuê {rentalSession.item.name}
                    </span>
                    <button onClick={() => setRentalSession(null)} className="p-1 rounded-full bg-slate-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {rentalSession.step === 1 && (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={rentalSession.phone}
                        onChange={(e) => setRentalSession({ ...rentalSession, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        placeholder="Số điện thoại khách thuê"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((b) => (
                          <button
                            key={b}
                            onClick={() => setRentalSession({ ...rentalSession, blocks: b })}
                            className={`p-2.5 rounded-xl border-2 text-center ${
                              rentalSession.blocks === b ? `${theme.primaryBorder} ${theme.lightBg}` : 'border-slate-200'
                            }`}
                          >
                            <div className="text-xs font-black">{b} Block</div>
                            <div className="text-[10px] font-bold text-slate-500">{b * 3}h</div>
                          </button>
                        ))}
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between text-xs font-bold">
                        <span>
                          {rentalSession.blocks} Block ({rentalSession.blocks * 3} giờ)
                        </span>
                        <span className="text-amber-700 font-black">
                          {(rentalSession.blocks * rentalSession.item.pricePerBlock).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          wipeCustomerMiniPhone(`Khách ${rentalSession.phone} thuê ${rentalSession.item.name}`, rentalSession.phone);
                          setRentalSession({ ...rentalSession, step: 2, isSpinning: false, isStepDone: false });
                        }}
                        className={`w-full ${theme.primaryBg} text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>HIỆN MÃ QR XÁC THỰC</span>
                      </button>
                    </div>
                  )}

                  {rentalSession.step === 2 && (
                    <div className="text-center space-y-3">
                      <div className="text-xs font-extrabold text-slate-700">Quét Mã QR Xác Thực Khách Hàng</div>
                      <div className="w-32 h-32 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center relative border-2 border-slate-200">
                        <QrCode className="w-20 h-20 text-slate-800" />
                        {rentalSession.isSpinning && (
                          <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-1" />
                            <span className="text-[10px] font-bold">Đang xác thực...</span>
                          </div>
                        )}
                        {rentalSession.isStepDone && (
                          <div className="absolute inset-0 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-700 font-black text-xs">
                            ✅ Xác Thực Thành Công!
                          </div>
                        )}
                      </div>
                      <button
                        onClick={triggerRentalAuth}
                        className={`w-full ${theme.primaryBg} text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5`}
                      >
                        <ScanLine className="w-4 h-4" />
                        <span>GIẢ LẬP QUÉT QR & XÁC THỰC</span>
                      </button>
                    </div>
                  )}

                  {rentalSession.step === 3 && (
                    <div className="text-center space-y-3">
                      <div className="text-xs font-extrabold text-emerald-700">
                        QR Thanh Toán • {(rentalSession.blocks * rentalSession.item.pricePerBlock).toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="w-32 h-32 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center relative border-2 border-emerald-300">
                        <QrCode className="w-20 h-20 text-emerald-800" />
                        {rentalSession.isSpinning && (
                          <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin mb-1" />
                            <span className="text-[10px] font-bold text-emerald-700">Đang thanh toán...</span>
                          </div>
                        )}
                        {rentalSession.isStepDone && (
                          <div className="absolute inset-0 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-700 font-black text-xs">
                            ✅ Đã Thanh Toán Xong!
                          </div>
                        )}
                      </div>
                      <button
                        onClick={triggerRentalPayment}
                        className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>GIẢ LẬP ĐÃ THANH TOÁN XONG</span>
                      </button>
                    </div>
                  )}

                  {rentalSession.step === 4 && (
                    <div className="text-center space-y-3">
                      <div className="text-sm font-black text-emerald-700">
                        🔓 Ngăn #{String(rentalSession.item.boxId).padStart(2, '0')} Đã Mở!
                      </div>
                      <p className="text-xs text-slate-500">Vui lòng lấy [{rentalSession.item.name}] và đóng cửa tủ.</p>
                      <button
                        onClick={finishRentalDoorClose}
                        className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black text-xs"
                      >
                        ĐÃ LẤY ĐỒ & ĐÓNG CỬA TỦ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. POPUP BE BÉ = 1/2 MÀN HÌNH ĐIỆN THOẠI BÊN CẠNH */}
        <div className="w-[280px] h-[450px] bg-slate-800 rounded-[40px] p-2 shadow-2xl flex flex-col overflow-hidden border-2 border-slate-600 lg:mt-12">
          <div className="w-full h-full bg-white rounded-[32px] flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-slate-900">Tin Nhắn Khách Hàng (1/2)</div>
                <div className={`text-[10px] font-bold font-mono ${theme.primaryText}`}>SĐT: {customerPhoneOwner}</div>
              </div>
              <button
                onClick={() => wipeCustomerMiniPhone('Làm mới thủ công')}
                className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200"
              >
                Xóa trắng
              </button>
            </div>

            <div className="flex-1 p-3 bg-slate-100/70 flex flex-col justify-center">
              {!customerMsg ? (
                <div className="text-center space-y-2 p-2">
                  <Sparkles className={`w-6 h-6 mx-auto ${theme.primaryText}`} />
                  <div className="text-xs font-extrabold text-slate-700">Đã Làm Mới Thông Báo</div>
                  <p className="text-[10px] text-slate-500">{clearReason}</p>
                </div>
              ) : (
                <div className="bg-white border-2 border-emerald-400 rounded-2xl p-3 shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-emerald-700">
                    <span className="flex items-center gap-1">
                      <BellRing className="w-3 h-3" /> {customerMsg.title}
                    </span>
                    <span className="text-slate-400">{customerMsg.timeStr}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{customerMsg.bodyText}</p>
                  {customerMsg.highlightCode && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">4 số cuối MVĐ:</span>
                      <span className="text-base font-black text-emerald-600 font-mono">{customerMsg.highlightCode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
