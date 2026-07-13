import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};
