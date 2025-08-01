import express from "express"
import categoryRoutes from "./category.js"
import productRoutes from "./product.js"

const rootRouter = express.Router()

rootRouter.use("/categories",categoryRoutes)
rootRouter.use("/products", productRoutes)

export default rootRouter