const { Customer, Staff } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ✅ Create Customer
const createCustomer = async (req, res) => {
  try {
    const { full_name, email, phone_number, dob, whatsapp, source } = req.body;

    const existing = await Customer.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const dummyPassword = await bcrypt.hash("not_used", 10);

    const customer = await Customer.create({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone_number?.trim(),
      dob,
      whatsapp: whatsapp?.trim(),
      source: source?.trim(),
      password: dummyPassword,
      role: "customer",
    });

    const safeCustomer = customer.toJSON();
    delete safeCustomer.password;

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: safeCustomer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ["id", "full_name", "email", "phone_number", "whatsapp", "dob", "source"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Update Customer
const updateCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    await customer.update(req.body);
    res.status(200).json({ success: true, message: "Customer updated", data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Customer
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    await customer.destroy();
    res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Staff Login
const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const staff = await Staff.findOne({
      where: { email },
      attributes: { include: ['password'] } // ✅ force include password
    });

    if (!staff) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!staff.password) {
      return res.status(400).json({
        success: false,
        message: "No password stored for this staff account",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: staff.id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    return res.status(200).json({
      success: true,
      token,
      staff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Create Staff
const createStaff = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone_number,
      role,
      position,
      initial_salary,
      commission,
      status,
      father_name,
      dob,
      cnic,
      address,
      experience,
      joining_date,
    } = req.body;

    const allowedRoles = ["super_admin", "admin", "employee1", "employee2", "viewer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid staff role" });
    }

    const existing = await Staff.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password.trim())) {
      return res.status(400).json({ success: false, message: "Weak password format" });
    }

    const hashPassword = await bcrypt.hash(password.trim(), 10);

    const staff = await Staff.create({
      full_name,
      email,
      password: hashPassword,
      phone_number,
      role,
      position,
      initial_salary,
      commission,
      status,
      father_name,
      dob,
      cnic,
      address,
      experience,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
    });

    res.status(201).json({ success: true, message: "Staff created successfully", data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Staff (Fixed version)
const getAllStaff = async (req, res) => {
  try {
    const staffs = await Staff.findAll({
      attributes: [
        "id",
        "full_name",
        "email",
        "father_name",
        "dob",
        "cnic",
        "phone_number",
        "address",
        "experience",
        "position",
        "joining_date",
        "leave_date",
        "initial_salary",
        "commission_rate",
        "role",
        "status"
      ],
      where: {
        deletedAt: null
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: staffs,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

// ✅ Update Staff
const updateStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    await staff.update(req.body);
    res.status(200).json({ success: true, message: "Staff updated", data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Staff
const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    await staff.destroy();
    res.status(200).json({ success: true, message: "Staff deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCustomer,
  updateCustomer,
  getAllCustomers,
  deleteCustomer,
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  loginStaff, 
};