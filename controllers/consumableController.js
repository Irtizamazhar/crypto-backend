// controllers/consumableController.js
const { ConsumableUsage, Product } = require('../models');

const getAllConsumables = async (req, res) => {
  try {
    const usages = await ConsumableUsage.findAll({
      order: [['date','DESC']],
      include: [{
        model: Product,
        as: 'product',
        attributes:['id','name','usesRemaining']
      }],
    });
    return res.status(200).json({ success:true, data:usages });
  } catch (err) {
    return res.status(500).json({ success:false, message:'Internal Server Error' });
  }
};

const getConsumablesByProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      attributes:['id','name','usesRemaining'],
      include: [{
        model: ConsumableUsage,
        as: 'usages',
        order: [['date','DESC']],
      }],
    });
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' });

    return res.status(200).json({ success:true, data:product });
  } catch (err) {
    return res.status(500).json({ success:false, message:'Internal Server Error' });
  }
};

module.exports = { getAllConsumables, getConsumablesByProduct };
