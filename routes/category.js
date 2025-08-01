import express from "express";
import { 
  createCategory, 
  deleteCategory, 
  editCategory,
  getAllCategories,
  getCategoriesAdvanced,
  getActiveCategories,
  getMainCategories,
  getSubCategories,
  getCategoryById,
  getCategoryBySlug
} from "../controllers/category.js";

const categoryRoutes = express.Router();

// CRUD İşlemleri
categoryRoutes.post("/create-category", createCategory);
categoryRoutes.put("/edit-category/:id", editCategory);
categoryRoutes.delete("/delete-category/:id", deleteCategory);

// Listeleme İşlemleri
categoryRoutes.get("/", getAllCategories); // Tüm kategoriler (basit)
categoryRoutes.get("/advanced", getCategoriesAdvanced); // Gelişmiş listeleme (filtreleme, sayfalama, arama)
categoryRoutes.get("/active", getActiveCategories); // Sadece aktif kategoriler
categoryRoutes.get("/main", getMainCategories); // Ana kategoriler (parentCategory: null)
categoryRoutes.get("/sub/:parentId", getSubCategories); // Alt kategoriler

// Tekil Getirme İşlemleri
categoryRoutes.get("/id/:id", getCategoryById); // ID ile kategori getir
categoryRoutes.get("/slug/:slug", getCategoryBySlug); // Slug ile kategori getir

export default categoryRoutes;