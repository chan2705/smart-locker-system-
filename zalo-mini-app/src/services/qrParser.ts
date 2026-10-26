import { QrDeeplinkParams } from '../types';

export function parseDeeplinkQr(): QrDeeplinkParams | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    let hashParams = new URLSearchParams();
    if (window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      hashParams = new URLSearchParams(hashQuery);
    }

    const cab = urlParams.get('cab') || hashParams.get('cab');
    const tsStr = urlParams.get('ts') || hashParams.get('ts');
    const nonceStr = urlParams.get('nonce') || hashParams.get('nonce');
    const sig = urlParams.get('sig') || hashParams.get('sig');

    if (cab && tsStr && sig) {
      const ts = parseInt(tsStr, 10);
      const nonce = nonceStr ? parseInt(nonceStr, 10) : 0;
      return {
        cab,
        ts,
        nonce,
        sig,
        isValid: true,
      };
    }
  } catch (err) {
    console.error('Error parsing Deeplink QR parameters:', err);
  }

  return null;
}
