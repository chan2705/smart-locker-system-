import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LockerApi } from '../services/api';
import { PackageCheck, KeyRound, Unlock, RefreshCw } from 'lucide-react';

export const ResidentView: React.FC = () => {
  const {
    userPhone,
    residentParcels,
    qrParams,
    openUnlockModal,
    fetchResidentParcels,
    fetchCabinetStatus,
  } = useAppStore();

  const [pinCode, setPinCode] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlockByPin = async () => {
    if (!pinCode.trim() || pinCode.trim().length < 6) {
      setErrorMsg('Vui lòng nhập đúng mã PIN 6 chữ số!');
      return;
    }

    setErrorMsg(null);
    setIsUnlocking(true);

    try {
      const res = await LockerApi.residentPickup({
        pinCode: pinCode.trim(),
        cab: qrParams?.cab,
        ts: qrParams?.ts,
        nonce: qrParams?.nonce,
        sig: qrParams?.sig,
      });

      setIsUnlocking(false);
      setPinCode('');

      openUnlockModal({
        title: `ĐÃ MỞ NGĂN #${String(res.boxId).padStart(2, '0')}`,
        message: `Cửa tủ đã mở thành công. Vui lòng lấy kiện hàng ra và đóng chặt cánh cửa lại!`,
        boxId: res.boxId,
      });

      await fetchResidentParcels();
      await fetchCabinetStatus();
    } catch (err: any) {
      setIsUnlocking(false);
      setErrorMsg(err.message || 'Mã PIN không chính xác');
    }
  };

  const handleUnlockParcel = async (parcelId: string, boxId: number) => {
    setErrorMsg(null);
    setIsUnlocking(true);

    try {
      const res = await LockerApi.residentPickup({
        parcelId,
        cab: qrParams?.cab,
        ts: qrParams?.ts,
        nonce: qrParams?.nonce,
        sig: qrParams?.sig,
      });

      setIsUnlocking(false);

      openUnlockModal({
        title: `ĐÃ MỞ NGĂN #${String(res.boxId).padStart(2, '0')}`,
        message: `Cửa tủ đã bung mở! Xin mời lấy kiện hàng ra và đóng chặt cửa tủ lại.`,
        boxId: res.boxId,
      });

      await fetchResidentParcels();
      await fetchCabinetStatus();
    } catch (err: any) {
      setIsUnlocking(false);
      setErrorMsg(err.message || 'Không thể mở tủ');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Bưu Kiện Đang Chờ Nhận</h2>
            <p className="text-xs text-slate-500 font-medium">Bấm mở tủ ngay bên dưới</p>
          </div>

          <button
            onClick={() => fetchResidentParcels()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {residentParcels.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="text-sm font-extrabold text-slate-800">Không có kiện hàng nào đang chờ</div>
            <p className="text-xs text-slate-500">
              Khi Shipper gửi hàng vào tủ với SĐT của bạn, danh sách sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {residentParcels.map((p) => {
              return (
                <div
                  key={p.id}
                  className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 hover:border-blue-400 space-y-3 transition shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                        #{p.box_id}
                      </span>
                      <div>
                        <div className="text-sm font-black text-slate-900">Kiện hàng Ngăn #{p.box_id}</div>
                        <div className="text-xs text-slate-500 font-medium">SĐT: {p.recipient_phone}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Cỡ {p.size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 font-bold">Mã PIN dự phòng:</span>
                    <span className="text-amber-700 font-mono font-black tracking-widest text-base">{p.pin_code}</span>
                  </div>

                  <button
                    onClick={() => handleUnlockParcel(p.id, p.box_id)}
                    disabled={isUnlocking}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>MỞ TỦ LẤY ĐỒ NGAY</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual PIN Code Input Option */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Mở Bằng Mã PIN</h2>
            <p className="text-xs text-slate-500 font-medium">Dành cho người nhận hộ qua SMS</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            pattern="[0-9]*"
            maxLength={6}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Nhập PIN 6 số"
            className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white px-3 py-2.5 text-center font-mono text-lg font-black tracking-widest rounded-xl text-slate-900"
          />

          <button
            onClick={handleUnlockByPin}
            disabled={isUnlocking || pinCode.length < 6}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <span>Mở Tủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
