const db = require('../models');
const { Product, StockLog } = db;

// ✅ Create Product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      category,
      subCategory,
      purchasingPrice,
      sellingPrice,
      usesRemaining,
      usesPerUnit,
      reorderLevel,
      commissionRate,
    } = req.body;

    if (!name || !barcode || !purchasingPrice || !sellingPrice || usesRemaining == null) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const status =
      usesRemaining === 0
        ? "Out of Stock"
        : usesRemaining < 10
        ? "Low Stock"
        : "In Stock";

    const product = await Product.create({
      name,
      barcode,
      category,
      subCategory,
      purchasingPrice,
      sellingPrice,
      usesRemaining,
      usesPerUnit,
      reorderLevel,
      commissionRate,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ✅ Get All Products
const getAllProducts = async (req, res) => {
  try {
    // Fetch products in descending order of creation date, including stock logs
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: StockLog,
          as: 'stockLogs',
          attributes: [
            'id',
            'date',
            'reason',
            'change',
            'newQuantity',
            'referenceId',
            'notes'
          ],
          order: [['date', 'DESC']]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ✅ Update Product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      barcode,
      category,
      subCategory,
      purchasingPrice,
      sellingPrice,
      usesRemaining,
      usesPerUnit,
      reorderLevel,
      commissionRate,
    } = req.body;

    const status =
      usesRemaining === 0
        ? "Out of Stock"
        : usesRemaining < 10
        ? "Low Stock"
        : "In Stock";

    await product.update({
      name,
      barcode,
      category,
      subCategory,
      purchasingPrice,
      sellingPrice,
      usesRemaining,
      usesPerUnit,
      reorderLevel,
      commissionRate,
      status,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ✅ Delete Product
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const decrementStock = async (req, res) => {
  try {
    const { quantity } = req.body;            // e.g. { quantity: 1 }
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:"Product not found" });

    product.currentStock -= quantity;
    await product.save();                     // fires beforeSave hook to update status

    await StockLog.create({                   // record the change
      productId:   product.id,
      productName: product.name,
      date:        new Date(),
      reason:      "Sale",
      change:      -quantity,
      newQuantity: product.currentStock,
      referenceId: `SALE-${Date.now()}`,
      notes:       "Sold via POS",
    });

    return res.json({ success:true, data: product });
  } catch (err) {
    return res.status(500).json({ success:false, message:"Internal Server Error" });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  decrementStock,
};
