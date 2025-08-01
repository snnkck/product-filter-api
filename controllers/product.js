import Category from '../schema/categorySchema.js';
import Product from '../schema/productSchema.js';
import mongoose from 'mongoose';


export const getAllProducts = async (req, res) =>{
    // // Filtreleme ve sayfalama
    // /api/products?category=64a1b2c3d4e5f6789&minPrice=100&maxPrice=500&page=1&limit=10

    // Text search
    // GET /api/products?search=iphone&sortBy=price&sortOrder=asc

    // PATCH /api/products/64a1b2c3d4e5f6789/stock
    // { "stockQuantity": 50, "inStock": true }

    try {
      const {
        page = 1,
        limit = 10,
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        tags,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Filter objesi oluştur
      const filter = {};
      
      if (category) filter.category = category;
      if (brand) filter.brand = new RegExp(brand, 'i');
      if (inStock !== undefined) filter.inStock = inStock === 'true';
      if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
      
      // Fiyat aralığı filtresi
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      // Text search
      if (search) {
        filter.$text = { $search: search };
      }

      // Sıralama objesi
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Sayfalama
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const products = await Product.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ürünler getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  // Tek ürün getir
export const getProductById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID\'si'
        });
      }

      const getProduct = await Product.findById(id).populate('category', 'name');

      if (!getProduct) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        data: getProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ürün getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  // Yeni ürün oluştur
export const createProduct = async (req, res) => {
    try {
      const productData = req.body;

      // Kategori ID'sinin geçerliliğini kontrol et
      if (!mongoose.Types.ObjectId.isValid(productData.category)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori ID\'si'
        });
      }

      const newProduct = new Product(productData);
      await newProduct.save();

      const populatedProduct = await Product.findById(Product._id)
        .populate('category', 'name');

      res.status(201).json({
        success: true,
        message: 'Ürün başarıyla oluşturuldu',
        data: populatedProduct
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validasyon hatası',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Ürün oluşturulurken hata oluştu',
        error: error.message
      });
    }
  }

  // Ürün güncelle
export const updateProduct = async(req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID\'si'
        });
      }

      // Kategori güncellenmişse ID'sinin geçerliliğini kontrol et
      if (updateData.category && !mongoose.Types.ObjectId.isValid(updateData.category)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori ID\'si'
        });
      }

      const editProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');

      if (!editProduct) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Ürün başarıyla güncellendi',
        data: editProduct
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validasyon hatası',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Ürün güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // Ürün sil
export const deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID\'si'
        });
      }

      const deletedProduct = await Product.findByIdAndDelete(id);

      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Ürün başarıyla silindi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ürün silinirken hata oluştu',
        error: error.message
      });
    }
  }

  // Stok güncelle
export const updateStock = async (req, res) => {
    try {
      const { id } = req.params;
      const { stockQuantity, inStock } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID\'si'
        });
      }

      const updateData = {};
      if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
      if (inStock !== undefined) updateData.inStock = inStock;

      const productStock = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');

      if (!productStock) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Stok başarıyla güncellendi',
        data: productStock
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Stok güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // İndirim güncelle
export const updateDiscount = async (req, res) => {
    try {
      const { id } = req.params;
      const { discount } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID\'si'
        });
      }

      const discountProduct = await Product.findByIdAndUpdate(
        id,
        { discount },
        { new: true, runValidators: true }
      ).populate('category', 'name');

      if (!discountProduct) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'İndirim başarıyla güncellendi',
        data: discountProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'İndirim güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // Rating güncelle
export const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    // ... validation kodları ...

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const currentAverage = product.ratings.average || 0;
    const currentCount = product.ratings.count || 0;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    product.ratings.average = Math.round(newAverage * 10) / 10;
    product.ratings.count = newCount;

    console.log('Güncellenen ratings:', product.ratings);
    
    // Eğer nested object varsa bunu ekleyin:
    product.markModified('ratings');
    
    await product.save();
    
    await product.populate('category', 'name');
    
    res.status(200).json({
      success: true,
      message: 'Rating başarıyla güncellendi',
      data: product
    });
    
  } catch (error) {
    console.error('Rating güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rating güncellenirken hata oluştu',
      error: error.message
    });
  }
}

  // Kategoriye göre ürünler
export const getProductsByCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori ID\'si'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const products = await Product.find({ category: categoryId })
        .populate('category', 'name')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments({ category: categoryId });

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ürünler getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  // İndirimli ürünler
export const getDiscountedProducts = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const now = new Date();
      const products = await Product.find({
        'discount.isActive': true,
        $or: [
          { 'discount.startDate': { $exists: false } },
          { 'discount.startDate': { $lte: now } }
        ],
        $or: [
          { 'discount.endDate': { $exists: false } },
          { 'discount.endDate': { $gte: now } }
        ]
      })
      .populate('category', 'name')
      .skip(skip)
      .limit(parseInt(limit));

      const total = await Product.countDocuments({
        'discount.isActive': true,
        $or: [
          { 'discount.startDate': { $exists: false } },
          { 'discount.startDate': { $lte: now } }
        ],
        $or: [
          { 'discount.endDate': { $exists: false } },
          { 'discount.endDate': { $gte: now } }
        ]
      });

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'İndirimli ürünler getirilirken hata oluştu',
        error: error.message
      });
    }
  }


