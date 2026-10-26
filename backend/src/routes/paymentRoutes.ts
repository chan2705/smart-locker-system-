import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';

export const paymentRouter = Router();

// Webhook endpoint with x-payos-signature verification & Idempotency check
paymentRouter.post('/deposit-webhook', async (req: Request, res: Response) => {
  try {
    const { orderId, amount, payment_tx_id, txHash } = req.body;
    const signatureHeader = req.headers['x-payos-signature'] as string | undefined;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Thiếu orderId!' });
    }

    const txId = payment_tx_id || txHash;

    const result = await PaymentService.processDepositWebhook(
      orderId,
      amount ? Number(amount) : undefined,
      txId,
      signatureHeader
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
