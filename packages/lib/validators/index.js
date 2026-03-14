import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string(),
        quantity: z.number().int().positive(),
        variant: z.string().optional(),
      })
    )
    .min(1),
  shippingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zip: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().min(1),
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(1),
});

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10).max(1000),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().optional(),
});
