// server.js (or app.js)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./util/config/db');
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// Routes
const customerRoute = require('./routes/customerRoute');
const staffRoute = require('./routes/staffRoute');
const appointmentRoute = require('./routes/appointmentRoutes');
const serviceRoute = require('./routes/serviceRoutes');
const productRoute = require('./routes/product');
const consumableRoute = require('./routes/consumables');
const salesRoute = require('./routes/sales');
const parkedSalesRoute = require('./routes/parkedSales');
const attendanceRoute = require('./routes/attendance');
const performanceRoutes = require("./routes/performanceRoutes");
const payrollRoute = require("./routes/payrollRoute"); // Added payroll route
const statsRouter = require('./routes/stats');


// Middleware setup
app.use(
  cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','PATCH'],
    allowedHeaders: ['Content-Type','Authorization'],
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.sendStatus(200));

// Serve static images
app.use('/images', express.static('public/images'));

// API Routes
app.use('/api/customers', customerRoute);
app.use('/api/staffs', staffRoute);
app.use('/api/appointments', appointmentRoute);
app.use('/api/services', serviceRoute);
app.use('/api/products', productRoute);
app.use('/api/consumables', consumableRoute);
app.use('/api/sales', salesRoute);
app.use('/api/parked-sales', parkedSalesRoute);
app.use('/api/attendance', attendanceRoute);
app.use("/api/staffs", performanceRoutes);
app.use("/api/payroll", payrollRoute); // Added payroll route
app.use('/api/stats', statsRouter);


// Global error handler
app.use(ErrorMiddleware);

// DB connection and server startup
sequelize
  .authenticate()
  .then(() => {
    return sequelize.sync({ alter: true }); // Use alter: true for development only
  })
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    process.exit(1);
  });