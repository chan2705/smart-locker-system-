import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { parseDeeplinkQr } from './services/qrParser';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ShipperView } from './views/ShipperView';
import { ResidentView } from './views/ResidentView';
import { RentalView } from './views/RentalView';
import { EkycModal } from './components/EkycModal';
import { VietQrDepositModal } from './components/VietQrDepositModal';
import { SuccessUnlockModal } from './components/SuccessUnlockModal';

export const App: React.FC = () => {
  const {
    currentTab,
    login,
    setQrParams,
    fetchCabinetStatus,
    fetchResidentParcels,
    fetchRentalCatalog,
    checkEkycStatus,
    fetchUserRentalOrders,
  } = useAppStore();

  useEffect(() => {
    // 1. Authenticate with Backend via JWT
    login();

    // 2. Parse 16-hex Deeplink QR Query Parameters from ESP32-S3 Dynamic QR
    const qr = parseDeeplinkQr();
    if (qr) {
      console.log('Scanned Dynamic QR Deeplink (16-Hex + Nonce):', qr);
      setQrParams(qr);
    }

    // 3. Initialize application state
    fetchCabinetStatus();
    fetchResidentParcels();
    fetchRentalCatalog();
    checkEkycStatus();
    fetchUserRentalOrders();

    // 4. Periodic polling every 6s for real-time box updates
    const interval = setInterval(() => {
      fetchCabinetStatus();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col max-w-md mx-auto relative shadow-sm">
      <Header />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {currentTab === 'shipper' && <ShipperView />}
        {currentTab === 'resident' && <ResidentView />}
        {currentTab === 'rental' && <RentalView />}
      </main>

      <BottomNav />

      <EkycModal />
      <VietQrDepositModal />
      <SuccessUnlockModal />
    </div>
  );
};
