import { Router, Response } from 'express';
import { LockerService } from '../services/lockerService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { config } from '../config';

export const residentRouter = Router();

// Get resident parcel list - strictly uses authenticated phone from JWT
residentRouter.get('/parcels', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const phone = req.user?.phone;
    const cabId = (req.query.cab as string) || config.cabinetId;

    if (!phone) {
      return res.status(401).json({ success: false, error: 'Không tìm thấy số điện thoại trong JWT token!' });
    }

    const parcels = LockerService.getResidentParcels(phone, cabId);
    res.json({ success: true, data: parcels });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pickup parcel using PIN code or Parcel ID - secured by JWT
residentRouter.post('/pickup', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pinCode, parcelId, cab, ts, nonce, sig } = req.body;
    const residentPhone = req.user?.phone;

    if (!pinCode && !parcelId) {
      return res.status(400).json({ success: false, error: 'Cần nhập mã PIN 6 số hoặc chọn kiện hàng!' });
    }

    const result = await LockerService.residentPickup({
      pinCode,
      parcelId,
      recipientPhone: residentPhone,
      cab,
      ts: ts ? Number(ts) : undefined,
      nonce: nonce !== undefined ? Number(nonce) : undefined,
      sig,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
