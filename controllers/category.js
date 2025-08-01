import Category from "../schema/categorySchema.js";
import slugify from "slugify";
import mongoose from "mongoose";

export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    
    // Gerekli alanları kontrol et
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Kategori adı gereklidir"
      });
    }
    
    const slugy = slugify(name, {
      replacement: '-',  // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: true,      // convert to lower case, defaults to `false`
      strict: false,     // strip special characters except replacement, defaults to `false`
      locale: 'tr',      // language code of the locale to use
      trim: true         // trim leading and trailing replacement chars, defaults to `true`
    });

 
    const checkCategory = await Category.findOne({ name });
    
    if (checkCategory) {
      return res.status(400).json({
        success: false,
        message: "Bu kategori zaten kayıtlı"
      });
    }
    
    const newCategory = new Category({
      name,
      slug: slugy,
      description,
      parentCategory
    });
    
    const savedCategory = await newCategory.save();
    
    return res.status(201).json({
      success: true,
      data: savedCategory,
      message: "Kategori başarılı bir şekilde eklendi."
    });
    
  } catch (err) {
    console.error("Create category error:", err);
    return res.status(500).json({
      success: false,
      message: "Kategori kayıt edilemedi",
      error: err.message
    });
  }
};

export const editCategory = async (req, res) => {
  const id = req.params.id;
  
  // ObjectId formatını kontrol et
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz kategori ID formatı!"
    });
  }
  
  try {
    const checkCategory = await Category.findOne({ _id: id });
    
    if (!checkCategory) {
      return res.status(404).json({
        success: false,
        message: "Böyle bir kategori yok!"
      });
    }
    
    const { name, description, isActive, parentCategory, } = req.body;
    
    // Name alanı varsa slug oluştur
    let updateData = {
      updatedAt: Date.now()
    };
    
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, {
        replacement: '-',
        remove: undefined,
        lower: true,
        strict: true,
        locale: 'tr',
        trim: true
      });
      updateData.parentCategory = parentCategory
    }
    
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: "Kategori başarılı bir şekilde güncellendi."
    });
    
  } catch (err) {
    console.error("Edit category error:", err);
    res.status(500).json({
      success: false,
      message: "Kategori güncellenirken bir hata oluştu.",
      error: err.message
    });
  }
};

export const deleteCategory = async (req, res) => {
  const id = req.params.id;
  
  // ObjectId formatını kontrol et
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz kategori ID formatı!"
    });
  }
  
  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Silinecek kategori bulunamadı!"
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedCategory,
      message: "Kategori başarılı bir şekilde silindi!"
    });
    
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({
      success: false,
      message: "Kategori silinirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Tüm kategorileri listele (basit versiyon)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category
      .find()
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      message: "Kategoriler başarılı bir şekilde listelendi."
    });

  } catch (err) {
    console.error("Get all categories error:", err);
    res.status(500).json({
      success: false,
      message: "Kategoriler listelenirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Gelişmiş kategori listeleme (filtreleme, sayfalama, arama)
export const getCategoriesAdvanced = async (req, res) => {
  //GET /api/categories/advanced?page=1&limit=10&search=teknoloji&isActive=true&sortBy=name&sortOrder=asc
  try {
    const {
      page = 1,
      limit = 3,
      search = '',
      isActive,
      parentCategory,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Filtreleme koşulları
    const filter = {};

    // Arama (name ve description'da)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Aktiflik durumu filtresi
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Parent kategori filtresi
    if (parentCategory) {
      if (parentCategory === 'null') {
        filter.parentCategory = null; // Ana kategoriler
      } else if (mongoose.Types.ObjectId.isValid(parentCategory)) {
        filter.parentCategory = parentCategory;
      }
    }

    // Sıralama ayarları
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Sayfalama hesaplamaları
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Veri çekme
    const categories = await Category
      .find(filter)
      .populate('parentCategory', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Toplam kayıt sayısı
    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / parseInt(limit));

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCategories,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      message: "Kategoriler başarılı bir şekilde listelendi."
    });

  } catch (err) {
    console.error("Get categories advanced error:", err);
    res.status(500).json({
      success: false,
      message: "Kategoriler listelenirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Sadece aktif kategorileri listele
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description parentCategory image sortOrder');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      message: "Aktif kategoriler başarılı bir şekilde listelendi."
    });

  } catch (err) {
    console.error("Get active categories error:", err);
    res.status(500).json({
      success: false,
      message: "Aktif kategoriler listelenirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Ana kategorileri listele (parentCategory: null olanlar)
export const getMainCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ parentCategory: null, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description image sortOrder');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      message: "Ana kategoriler başarılı bir şekilde listelendi."
    });

  } catch (err) {
    console.error("Get main categories error:", err);
    res.status(500).json({
      success: false,
      message: "Ana kategoriler listelenirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Alt kategorileri listele (belirli bir parent kategori için)
export const getSubCategories = async (req, res) => {
  const { parentId } = req.params;

  // ObjectId formatını kontrol et
  if (!mongoose.Types.ObjectId.isValid(parentId)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz parent kategori ID formatı!"
    });
  }

  try {
    // Parent kategorinin varlığını kontrol et
    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent kategori bulunamadı!"
      });
    }

    const subCategories = await Category
      .find({ parentCategory: parentId, isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      parentCategory: {
        id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug
      },
      data: subCategories,
      message: "Alt kategoriler başarılı bir şekilde listelendi."
    });

  } catch (err) {
    console.error("Get sub categories error:", err);
    res.status(500).json({
      success: false,
      message: "Alt kategoriler listelenirken bir hata oluştu.",
      error: err.message
    });
  }
};

// ID ile tek kategori getir
export const getCategoryById = async (req, res) => {
  const { id } = req.params;

  // ObjectId formatını kontrol et
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz kategori ID formatı!"
    });
  }

  try {
    const categoryData = await Category
      .findById(id)
      .populate('parentCategory', 'name slug');

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Kategori bulunamadı!"
      });
    }

    res.status(200).json({
      success: true,
      data: categoryData,
      message: "Kategori başarılı bir şekilde getirildi."
    });

  } catch (err) {
    console.error("Get category by id error:", err);
    res.status(500).json({
      success: false,
      message: "Kategori getirilirken bir hata oluştu.",
      error: err.message
    });
  }
};

// Slug ile kategori getir
export const getCategoryBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const categoryData = await Category
      .findOne({ slug: slug })
      .populate('parentCategory', 'name slug');

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Kategori bulunamadı!"
      });
    }

    res.status(200).json({
      success: true,
      data: categoryData,
      message: "Kategori başarılı bir şekilde getirildi."
    });

  } catch (err) {
    console.error("Get category by slug error:", err);
    res.status(500).json({
      success: false,
      message: "Kategori getirilirken bir hata oluştu.",
      error: err.message
    });
  }
};