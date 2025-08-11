// controllers/salesController.js
const { Sale, SaleItem, Customer, Staff } = require('../models');

const createSale = async (req, res) => {
  try {
    const {
      customer_id, staff_id,
      items,           // array of { item_id, type, name, price, quantity }
      subtotal, discount,
      tip, total,
      payment_method, payment_amount,
      notes
    } = req.body;

    // 1) Create the sale header
    const sale = await Sale.create({
      customerId:    customer_id,
      staffId:       staff_id,
      subtotal, discount,
      tip, total,
      paymentMethod: payment_method,
      paymentAmount: payment_amount,
      notes
    });

    // 2) Bulk insert line items
    const saleItems = items.map(i => ({
      saleId:   sale.id,
      itemId:   i.item_id,
      type:     i.type,
      name:     i.name,
      price:    i.price,
      quantity: i.quantity || 1
    }));
    await SaleItem.bulkCreate(saleItems);

    // 3) Fetch the complete sale data with associations
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'phone_number'] },
        { model: Staff, as: 'staff', attributes: ['id', 'full_name'] },
        { model: SaleItem, as: 'items' }
      ]
    });

    return res.status(201).json({ 
      success: true, 
      data: completeSale 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'phone_number'] },
        { model: Staff, as: 'staff', attributes: ['id', 'full_name'] },
        { model: SaleItem, as: 'items' }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, data: sales });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { createSale, getAllSales };