const Category = require("../models/Category");
const mongoose = require("mongoose"); // ✅ Bắt buộc để sử dụng mongoose.Types.ObjectId

const Transaction = require("../models/Transaction");

const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Chuyển userId thành ObjectId để so sánh chính xác trong aggregate
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Lấy danh mục
    const categories = await Category.find({ userId });

    // Tính tổng giao dịch theo danh mục
    const totals = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$categoryId",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Chuyển totals thành object dễ lookup
    const totalMap = {};
    totals.forEach((item) => {
      totalMap[item._id.toString()] = item.totalAmount;
    });

    // Gắn thêm totalAmount vào từng danh mục
    const categoriesWithTotal = categories.map((cat) => {
      const total = totalMap[cat._id.toString()] || 0;
      return {
        ...cat.toObject(),
        totalAmount: total,
      };
    });

    res.status(200).json(categoriesWithTotal);
  } catch (err) {
    console.error("Lỗi khi lấy danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// [POST] /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    const userId = req.user.id;

    if (!name || !type) {
      return res.status(400).json({ message: "Thiếu tên hoặc loại danh mục" });
    }

    const newCategory = await Category.create({
      name,
      type,
      icon: icon || "fa-question-circle",
      userId,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo danh mục", error: err.message });
  }
};

// [PUT] /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    const category = await Category.findOne({ _id: id, userId });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    category.name = name || category.name;
    category.type = type || category.type;
    category.icon = icon || category.icon;

    await category.save();

    res.status(200).json(category);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật danh mục", error: err.message });
  }
};

// [DELETE] /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await Category.findOneAndDelete({ _id: id, userId });
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục để xóa" });
    }

    res.status(200).json({ message: "Xóa danh mục thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa danh mục", error: err.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
