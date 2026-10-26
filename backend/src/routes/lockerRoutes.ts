import { Router, Request, Response } from 'express';
import { LockerService } from '../services/lockerService';
import { AuthQrService } from '../services/authQrService';
import { lockerMqtt } from '../mqtt/mqttClient';
import { config } from '../config';

export const lockerRouter = Router();

// Get cabinet status & 12 boxes
lockerRouter.get('/status', (req: Request, res: Response) => {
  try {
    const cabId = (req.query.cab as string) || config.cabinetId;
    const data = LockerService.getCabinetStatus(cabId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate dynamic QR URL with 16-character signature and Nonce Counter
lockerRouter.get('/dynamic-qr', (req: Request, res: Response) => {
  try {
    const cab = (req.query.cab as string) || config.cabinetId;
    const qrData = AuthQrService.generateDynamicQr(cab);
    res.json({ success: true, data: qrData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify dynamic QR with Nonce Counter and Anti-Replay check
lockerRouter.post('/verify-qr', (req: Request, res: Response) => {
  try {
    const { cab, ts, nonce, sig } = req.body;
    if (!cab || ts === undefined || !sig) {
      return res.status(400).json({ success: false, error: 'Thiếu tham số QR (cab, ts, sig)!' });
    }

    const result = AuthQrService.verifyDynamicQr(cab, Number(ts), sig, nonce !== undefined ? Number(nonce) : 0);
    res.json({ success: result.valid, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual unlock (for testing / admin)
lockerRouter.post('/unlock-manual', async (req: Request, res: Response) => {
  try {
    const { box_id, pulse_ms } = req.body;
    if (!box_id) {
      return res.status(400).json({ success: false, error: 'box_id is required' });
    }

    const ack = await lockerMqtt.sendUnlockCommand(Number(box_id), pulse_ms || 400);
    res.json({ success: true, data: ack });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
