import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LockerApi } from '../services/api';
import { RentalItem } from '../types';
import { ShieldCheck, RotateCcw, ArrowRight, Unlock } from 'lucide-react';

export const RentalView: React.FC = () => {
  const {
    rentalCatalog,
    userRentalOrders,
    ekycProfile,
    qrParams,
    fetchRentalCatalog,
    fetchUserRentalOrders,
    checkEkycStatus,
    setEkycModalOpen,
    setVietQrModalOpen,
    openUnlockModal,
    fetchCabinetStatus,
  } = useAppStore();

  const [isCreatingOrder, setIsCreatingOrder] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    fetchRentalCatalog();
    fetchUserRentalOrders();
    checkEkycStatus();
  }, []);

  const handleRentClick = async (item: RentalItem) => {
    if (!ekycProfile || !ekycProfile.verified) {
      setEkycModalOpen(true);
      return;
    }

    setIsCreatingOrder(item.id);
    try {
      const res = await LockerApi.createRentalOrder({
        itemId: item.id,
        cab: qrParams?.cab,
        ts: qrParams?.ts,
        nonce: qrParams?.nonce,
        sig: qrParams?.sig,
      });

      setIsCreatingOrder(null);
      setVietQrModalOpen(true, res.order);
      await fetchUserRentalOrders();
    } catch (err: any) {
      setIsCreatingOrder(null);
      alert(err.message || 'Không thể tạo đơn thuê');
    }
  };

  const handleOpenReturn = async (orderId: string, boxId: number) => {
    setIsReturning(true);
    try {
      const res = await LockerApi.openForReturn(orderId, {
        cab: qrParams?.cab,
        ts: qrParams?.ts,
        nonce: qrParams?.nonce,
        sig: qrParams?.sig,
      });

      setIsReturning(false);

      openUnlockModal({
        title: `ĐÃ MỞ NGĂN #${String(res.boxId).padStart(2, '0')}`,
        message: `Ngăn số ${res.boxId} đã mở. Quý khách vui lòng đặt đồ vào ngăn tủ và đóng cửa. Tiền cọc sẽ được hoàn tự động!`,
        boxId: res.boxId,
      });

      await fetchCabinetStatus();
      await fetchUserRentalOrders();
    } catch (err: any) {
      setIsReturning(false);
      alert(err.message || 'Không thể mở tủ trả đồ');
    }
  };

  const activeOrders = userRentalOrders.filter(
    (o) => o.order_status === 'ACTIVE' || o.order_status === 'RETURN_PENDING'
  );

  return (
    <div className="space-y-4 pb-20">
      {/* eKYC Status Header */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ekycProfile?.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>Định danh eKYC:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ekycProfile?.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'}`}>
                {ekycProfile?.verified ? 'ĐÃ XÁC THỰC' : 'SẴN SÀNG'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {ekycProfile?.verified ? 'Đã xác thực định danh Mức 2' : 'Xác thực nhanh trong 1 giây'}
            </p>
          </div>
        </div>

        {!ekycProfile?.verified && (
          <button
            onClick={() => setEkycModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition"
          >
            Định danh
          </button>
        )}
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="bg-white border-2 border-blue-300 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">Đồ Bạn Đang Thuê (Cần Trả)</h3>
          </div>

          <div className="space-y-3">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900">{order.item_name || 'Thiết bị thông minh'}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Ngăn #{order.box_id}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenReturn(order.id, order.box_id)}
                  disabled={isReturning}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Mở Ngăn #{order.box_id} Để Trả Đồ</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rental Catalog */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Thiết Bị Tiện Ích</h2>
          <p className="text-xs text-slate-500 font-medium">Đặt cọc qua VietQR • Trả đồ hoàn cọc tự động</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {rentalCatalog.map((item) => {
            const isAvail = item.status === 'AVAILABLE';
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-blue-400 space-y-3 transition-all shadow-xs"
              >
                <div className="flex gap-3 items-center">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-2xl bg-slate-100 shrink-0 border border-slate-200"
                    loading="lazy"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Ngăn #{item.box_id}
                      </span>
                      <span className="text-xs font-black text-amber-700">
                        {item.hourly_rate.toLocaleString('vi-VN')} đ/h
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {item.name}
                    </h4>

                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      Cọc: {item.deposit_amount.toLocaleString('vi-VN')} đ (Hoàn lại 100%)
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Đối soát thẻ RFID</span>

                  <button
                    onClick={() => handleRentClick(item)}
                    disabled={!isAvail || isCreatingOrder === item.id}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition ${
                      isAvail
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isCreatingOrder === item.id ? (
                      <span>Đang tạo đơn...</span>
                    ) : isAvail ? (
                      <>
                        <span>Thuê Ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <span>Đang có người thuê</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
