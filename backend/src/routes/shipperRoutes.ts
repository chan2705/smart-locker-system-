import { Router, Response } from 'express';
import { LockerService } from '../services/lockerService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const shipperRouter = Router();

// Protected 1-Click Dropoff for Shipper
// Extracts shipper identity strictly from signed JWT Access Token
shipperRouter.post('/dropoff', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { size, recipientPhone, cab, ts, nonce, sig } = req.body;
    const shipperPhone = req.user?.phone;

    if (!size || !recipientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp: size (S/M/L) và recipientPhone!',
      });
    }

    if (!shipperPhone) {
      return res.status(401).json({ success: false, error: 'Không tìm thấy danh tính Shipper trong JWT!' });
    }

    const result = await LockerService.shipperDropoff({
      size,
      recipientPhone,
      shipperPhone,
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
