import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  width: Number,
  height: Number,
});

const variantSchema = new mongoose.Schema({
  name: String,      // e.g. "Size", "Color"
  options: [String], // e.g. ["S", "M", "L"]
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 }, // original price for sale display
    images: [imageSchema],
    category: { type: String, required: true, index: true },
    tags: [String],
    variants: [variantSchema],
    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    // Social media sharing meta
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

// Auto-generate slug from name
productSchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);
