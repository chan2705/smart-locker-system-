import { Router, Request, Response } from 'express';
import { EkycService } from '../services/ekycService';

export const ekycRouter = Router();

// Check eKYC status of a phone
ekycRouter.get('/status', (req: Request, res: Response) => {
  try {
    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Thiếu số điện thoại (phone)!' });
    }

    const result = EkycService.getEkycStatus(phone);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify eKYC (Simulated CCCD 2 sides + Liveness Face Check)
ekycRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phone, frontCardImg, backCardImg, faceVideoOrSelfie, fullName, idCardNo } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Thiếu số điện thoại!' });
    }

    const result = await EkycService.verifyEkyc({
      phone,
      frontCardImg,
      backCardImg,
      faceVideoOrSelfie,
      fullName,
      idCardNo,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
