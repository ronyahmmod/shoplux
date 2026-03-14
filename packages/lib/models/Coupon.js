import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.expiresAt && new Date() > this.expiresAt)
    return { valid: false, message: 'Coupon has expired' };
  if (this.maxUses !== null && this.usedCount >= this.maxUses)
    return { valid: false, message: 'Coupon usage limit reached' };
  return { valid: true };
};

export const Coupon =
  mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
