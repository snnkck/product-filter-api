import express from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, updateStock, updateDiscount, updateRating, getProductsByCategory, getDiscountedProducts} from '../controllers/product.js';
import { body, param, query } from 'express-validator';
import { validationMiddleware } from '../middlewares/productValidation.js';

const productRoutes = express.Router();

// Validation rules
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Ürün adı zorunludur')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Ürün adı 2-200 karakter arasında olmalıdır'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Açıklama maksimum 1000 karakter olabilir'),
  
  body('price')
    .isNumeric()
    .withMessage('Fiyat sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Fiyat 0 veya pozitif olmalıdır'),
  
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Marka adı maksimum 100 karakter olabilir'),
  
  body('category')
    .notEmpty()
    .withMessage('Kategori zorunludur')
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler array olmalıdır'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Her etiket maksimum 50 karakter olabilir'),
  
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('Stok durumu boolean olmalıdır'),
  
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok miktarı 0 veya pozitif integer olmalıdır'),
  
  body('ratings.average')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating ortalaması 0-5 arasında olmalıdır'),
  
  body('ratings.count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Rating sayısı 0 veya pozitif integer olmalıdır'),
  
  body('discount.type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('İndirim tipi percentage veya fixed olmalıdır'),
  
  body('discount.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('İndirim değeri 0 veya pozitif olmalıdır'),
  
  body('discount.isActive')
    .optional()
    .isBoolean()
    .withMessage('İndirim aktiflik durumu boolean olmalıdır'),
  
  body('discount.startDate')
    .optional()
    .isISO8601()
    .withMessage('Başlangıç tarihi geçerli bir tarih olmalıdır'),
  
  body('discount.endDate')
    .optional()
    .isISO8601()
    .withMessage('Bitiş tarihi geçerli bir tarih olmalıdır'),
  
  body('colors')
    .optional()
    .isArray()
    .withMessage('Renkler array olmalıdır'),
  
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Bedenler array olmalıdır'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Resimler array olmalıdır'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Her resim geçerli bir URL olmalıdır')
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Ürün adı 2-200 karakter arasında olmalıdır'),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fiyat 0 veya pozitif olmalıdır'),
    
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),
    
  // Diğer validasyonlar createProductValidation'daki gibi optional olarak...
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Geçerli bir MongoDB ID\'si giriniz')
];

const categoryIdValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz')
];

const stockUpdateValidation = [
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok miktarı 0 veya pozitif integer olmalıdır'),
    
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('Stok durumu boolean olmalıdır')
];

const discountUpdateValidation = [
  body('discount.type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('İndirim tipi percentage veya fixed olmalıdır'),
    
  body('discount.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('İndirim değeri 0 veya pozitif olmalıdır'),
    
  body('discount.isActive')
    .optional()
    .isBoolean()
    .withMessage('İndirim aktiflik durumu boolean olmalıdır'),
    
  body('discount.startDate')
    .optional()
    .isISO8601()
    .withMessage('Başlangıç tarihi geçerli bir tarih olmalıdır'),
    
  body('discount.endDate')
    .optional()
    .isISO8601()
    .withMessage('Bitiş tarihi geçerli bir tarih olmalıdır')
];

const ratingUpdateValidation = [
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating 1-5 arasında olmalıdır')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sayfa numarası 1 veya daha büyük olmalıdır'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır'),
    
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum fiyat 0 veya pozitif olmalıdır'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maksimum fiyat 0 veya pozitif olmalıdır'),
    
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('Stok durumu boolean olmalıdır'),
    
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'updatedAt', 'ratings.average'])
    .withMessage('Sıralama alanı geçersiz'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sıralama yönü asc veya desc olmalıdır')
];

// Routes

// GET /products - Tüm ürünleri listele (filtreleme, sıralama, sayfalama ile)
productRoutes.get('/', 
  queryValidation,
  validationMiddleware,
  getAllProducts
);

// GET /products/discounted - İndirimli ürünleri listele
productRoutes.get('/discounted',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validationMiddleware,
  getDiscountedProducts
);

// GET /products/category/:categoryId - Kategoriye göre ürünleri listele
productRoutes.get('/category/:categoryId',
  categoryIdValidation,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validationMiddleware,
  getProductsByCategory
);

// GET /products/:id - Tek ürün getir
productRoutes.get('/:id',
  mongoIdValidation,
  validationMiddleware,
  getProductById
);

// POST /products - Yeni ürün oluştur
productRoutes.post('/create-product',
  createProductValidation,
  validationMiddleware,
  createProduct
);

// PUT /products/:id - Ürün güncelle
productRoutes.put('/edit-product/:id',
  mongoIdValidation,
  updateProductValidation,
  validationMiddleware,
  updateProduct
);

// PATCH /products/:id/stock - Stok güncelle
productRoutes.patch('/:id/stock',
  mongoIdValidation,
  stockUpdateValidation,
  validationMiddleware,
  updateStock
);

// PATCH /products/:id/discount - İndirim güncelle
productRoutes.patch('/:id/discount',
  mongoIdValidation,
  discountUpdateValidation,
  validationMiddleware,
  updateDiscount
);

// PATCH /products/:id/rating - Rating ekle
productRoutes.patch('/:id/rating',
  mongoIdValidation,
  ratingUpdateValidation,
  validationMiddleware,
  updateRating
);

// DELETE /products/:id - Ürün sil
productRoutes.delete('/delete-product/:id',
  mongoIdValidation,
  validationMiddleware,
  deleteProduct
);

export default productRoutes;