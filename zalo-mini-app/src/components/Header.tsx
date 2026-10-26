import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldCheck, MapPin, QrCode, Phone } from 'lucide-react';

export const Header: React.FC = () => {
  const { cabinet, qrParams, userPhone, setUserPhone } = useAppStore();

  const handleEditPhone = () => {
    const input = prompt('Nhập số điện thoại của bạn:', userPhone);
    if (input && input.trim()) {
      setUserPhone(input.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            SL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">SmartLocker</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-bold">
                {qrParams?.cab || cabinet?.id || 'CAB_01'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
              <span>Sảnh S2.03 Vinhomes</span>
            </p>
          </div>
        </div>

        {/* User Phone & QR Proximity Status */}
        <div className="flex items-center gap-2">
          {qrParams?.sig ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold" title="Đã xác thực QR tại chỗ">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tại tủ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold" title="Mô phỏng demo">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo</span>
            </div>
          )}

          <button
            onClick={handleEditPhone}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition"
          >
            <Phone className="w-3 h-3 text-blue-600" />
            <span className="font-mono">{userPhone.slice(-4)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
