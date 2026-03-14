import { notFound } from 'next/navigation';
import { connectDB } from '@repo/lib/utils/db';
import { Product } from '@repo/lib/models/Product';
import ProductForm from '@/components/products/ProductForm';

export const metadata = { title: 'Edit Product' };

export default async function EditProductPage({ params }) {
  await connectDB();
  const product = await Product.findById(params.id).lean();
  if (!product) notFound();

  // Serialize for client component
  return <ProductForm product={JSON.parse(JSON.stringify(product))} />;
}
