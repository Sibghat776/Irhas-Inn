import express from "express";
import {
  addProduct,
  deleteProduct,
  getProductById,
  getProducts,
  rateProduct,
  updateProduct,
} from "../Controllers/productController.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/commonFunctions.js";
import { upload } from "../utils/cloudinary.js";

export let productRouter = express.Router();

productRouter.post(
  "/addProduct",
  verifyToken,
  verifyAdmin,
  upload.array("images", 5),
  addProduct,
);
productRouter.get("/getProduct/:id", getProductById);
productRouter.get("/getAllProducts", getProducts);
productRouter.put("/updateProduct/:id", verifyToken, verifyAdmin, updateProduct);
productRouter.delete("/deleteProduct/:id", verifyToken, verifyAdmin, deleteProduct);
productRouter.put("/productRatings/:id", verifyUser, rateProduct);
