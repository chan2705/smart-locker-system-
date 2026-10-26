import { Router, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const rentalRouter = Router();

// Public catalog
rentalRouter.get('/catalog', (req, res) => {
  try {
    const items = PaymentService.getRentalCatalog();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Secured: Get user rental orders - phone extracted strictly from JWT
rentalRouter.get('/orders', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const phone = req.user?.phone;
    if (!phone) {
      return res.status(401).json({ success: false, error: 'Không tìm thấy số điện thoại trong token!' });
    }

    const orders = PaymentService.getUserRentalOrders(phone);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Secured: Create rental reservation order
rentalRouter.post('/create-order', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, cab, ts, nonce, sig } = req.body;
    const userPhone = req.user?.phone;

    if (!userPhone || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin itemId hoặc danh tính người dùng trong token!',
      });
    }

    const result = await PaymentService.createRentalOrder(userPhone, itemId, { cab, ts, nonce, sig });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Secured: Unlock box for returning rental tool
rentalRouter.post('/open-return', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, cab, ts, nonce, sig } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Thiếu orderId!' });
    }

    const result = await PaymentService.openForReturn(orderId, { cab, ts, nonce, sig });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
