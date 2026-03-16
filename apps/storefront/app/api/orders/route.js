import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";
import { Product } from "@repo/lib/models/Product";
import { Coupon } from "@repo/lib/models/Coupon";
import { orderSchema } from "@repo/lib/validators";
import { withErrorHandler, requireAuth } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET /api/orders — current user's orders
export const GET = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  await connectDB();

  const orders = await Order.find({ user: session.user.id })
    .sort("-createdAt")
    .populate("items.product", "name slug images")
    .lean();

  return NextResponse.json({ orders });
});

// POST /api/orders — place a new order
export const POST = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await connectDB();

  const { items, shippingAddress, couponCode, paymentMethod } = parsed.data;

  // Fetch products and validate stock
  const productIds = items.map((i) => i.product);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });

  if (products.length !== items.length) {
    return NextResponse.json(
      { error: "One or more products are unavailable" },
      { status: 400 },
    );
  }

  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.product);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}"`);
    }
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    return {
      product: product._id,
      name: product.name,
      image: product.images[0]?.secure_url,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant,
    };
  });

  // Apply coupon
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon)
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 },
      );
    const validity = coupon.isValid();
    if (!validity.valid)
      return NextResponse.json({ error: validity.message }, { status: 400 });
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount for this coupon is ${coupon.minOrderAmount}`,
        },
        { status: 400 },
      );
    }
    discount =
      coupon.type === "percentage"
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  const shippingCost = subtotal >= 1000 ? 0 : 60; // free shipping over 1000
  const total = subtotal - discount + shippingCost;

  // Create order
  const order = await Order.create({
    user: session.user.id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    discount,
    total,
    couponCode,
    paymentMethod,
    statusHistory: [{ status: "pending", note: "Order placed" }],
  });

  // Decrement stock
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      }),
    ),
  );

  if (paymentMethod === "sslcommerez") {
    const SSLCommerzPayment = (await import("sslcommerz-lts")).default;
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const paymentData = {
      total_amount: total,
      currency: "BDT",
      tran_id: order._id.toString(),
      success_url: `${baseUrl}/api/payment/success`,
      fail_url: `${baseUrl}/api/payment/fail`,
      cancel_url: `${baseUrl}/api/payment/cancel`,
      ipn_url: `${baseUrl}/api/payment/ipn`,
      cus_name: shippingAddress.name,
      cus_email: session.user.email,
      cus_phone: shippingAddress.phone || "01700000000",
      cus_add1: shippingAddress.street,
      cus_city: shippingAddress.city,
      cus_country: shippingAddress.country || "Bangladesh",
      shipping_method: "Courier",
      product_name: orderItems
        .map((i) => i.name)
        .join(", ")
        .slice(0, 255),
      product_category: "General",
      product_profile: "general",
    };

    const apiResponse = await sslcz.init(paymentData);
    if (!apiResponse?.GatewayPageURL) {
      return NextResponse.json(
        { error: "Payment gateway error. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { order, gatewayUrl: apiResponse.GatewayPageURL },
      { status: 201 },
    );
  }

  return NextResponse.json({ order }, { status: 201 });
});
