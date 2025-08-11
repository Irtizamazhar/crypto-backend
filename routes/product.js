const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  decrementStock

} = require("../controllers/ProductController");

// ✅ Create Product
router.post("/", createProduct);

// ✅ Get All Products
router.get("/", getAllProducts);

// ✅ Update Product
router.put("/:id", updateProduct);

// ✅ Delete Product
router.delete("/:id", deleteProduct);
router.patch(
  "/:id/decrement-stock",
  decrementStock
);

module.exports = router;
