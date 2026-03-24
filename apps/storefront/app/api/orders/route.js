import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";
import { Product } from "@repo/lib/models/Product";
import { Coupon } from "@repo/lib/models/Coupon";
import { orderSchema } from "@repo/lib/validators";
import { withErrorHandler, requireAuth } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const GET = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;
  const session = await getServerSession(authOptions);
  await connectDB();
  const orders = await Order.find({ user: session.user.id })
    .sort("-createdAt")
    .lean();
  return NextResponse.json({ orders });
});

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

  const products = await Product.find({
    _id: { $in: items.map((i) => i.product) },
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
    subtotal += product.price * item.quantity;
    return {
      product: product._id,
      name: product.name,
      image: product.images[0]?.secure_url,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant,
    };
  });

  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon)
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    const validity = coupon.isValid();
    if (!validity.valid)
      return NextResponse.json({ error: validity.message }, { status: 400 });
    discount =
      coupon.type === "percentage"
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  const shippingCost = subtotal >= 1000 ? 0 : 60;
  const total = subtotal - discount + shippingCost;

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
    paymentStatus: "unpaid",
    status: "pending",
    statusHistory: [
      { status: "pending", note: "Order placed, awaiting payment" },
    ],
  });

  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      }),
    ),
  );

  if (paymentMethod === "cod") {
    await Order.findByIdAndUpdate(order._id, {
      status: "confirmed",
      $push: {
        statusHistory: {
          status: "confirmed",
          note: "Cash on delivery order confirmed",
        },
      },
    });
    return NextResponse.json(
      { order, redirect: "/orders?success=1" },
      { status: 201 },
    );
  }

  if (paymentMethod === "sslcommerz") {
    try {
      const SSLCommerzPayment = (await import("sslcommerz-lts")).default;
      const store_id = process.env.SSLCOMMERZ_STORE_ID;
      const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
      const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

      if (!store_id || !store_passwd) {
        throw new Error("SSLCommerz credentials not configured");
      }

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
        cus_name: shippingAddress.name || session.user.name,
        cus_email: session.user.email,
        cus_phone: shippingAddress.phone || "01700000000",
        cus_add1: shippingAddress.street || "N/A",
        cus_city: shippingAddress.city || "Dhaka",
        cus_country: shippingAddress.country || "Bangladesh",
        shipping_method: "Courier",
        product_name: orderItems
          .map((i) => i.name)
          .join(", ")
          .slice(0, 255),
        product_category: "General",
        product_profile: "general",
        num_of_item: items.length,
      };

      const apiResponse = await sslcz.init(paymentData);

      if (!apiResponse?.GatewayPageURL) {
        await Order.findByIdAndDelete(order._id);
        return NextResponse.json(
          { error: "Payment gateway unavailable. Please try again." },
          { status: 502 },
        );
      }

      return NextResponse.json(
        { order, gatewayUrl: apiResponse.GatewayPageURL },
        { status: 201 },
      );
    } catch (err) {
      await Order.findByIdAndDelete(order._id);
      console.error("SSLCommerz error:", err.message);
      return NextResponse.json(
        { error: `Payment error: ${err.message}` },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    { order, redirect: "/orders?success=1" },
    { status: 201 },
  );
});
