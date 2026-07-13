"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSignature = exports.razorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
exports.razorpay = new razorpay_1.default({
    key_id,
    key_secret,
});
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    try {
        const generated_signature = crypto_1.default
            .createHmac('sha256', key_secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        return generated_signature === signature;
    }
    catch (error) {
        console.error('Error verifying payment signature:', error);
        return false;
    }
};
exports.verifyPaymentSignature = verifyPaymentSignature;
