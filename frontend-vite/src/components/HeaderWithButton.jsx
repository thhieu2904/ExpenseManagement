import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const HeaderWithButton = ({ title, to }) => {
  return (
    <div className="flex justify-between items-center px-6 py-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <Link
        to={to}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
      >
        <Plus size={18} />
        Thêm giao dịch
      </Link>
    </div>
  );
};

export default HeaderWithButton;
