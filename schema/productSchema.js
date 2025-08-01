import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    text: true, // Full-text search için
  },
  description: {
    type: String,
    text: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  brand: {
    type: String,
    trim: true,
    index: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  colors: [String],
  sizes: [String],
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// İndirimli fiyat hesaplama virtual field
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount.isActive) return this.price;
  
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) return this.price;
  if (this.discount.endDate && now > this.discount.endDate) return this.price;
  
  if (this.discount.type === 'percentage') {
    return this.price * (1 - this.discount.value / 100);
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// updatedAt otomatik güncelleme
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

// Compound index'ler
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product