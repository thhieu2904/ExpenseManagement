import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Trang chủ", path: "/" },
  { label: "Danh mục", path: "/danh-muc" },
  { label: "Tài khoản", path: "/tai-khoan" },
  { label: "Mục tiêu", path: "/muc-tieu" },
  { label: "Ngân sách", path: "/ngan-sach" },
  { label: "Giao dịch", path: "/giao-dich" },
  { label: "Thống kê", path: "/thong-ke" },
];

const NavMenu = () => {
  return (
    <nav className="bg-gray-100 px-6 py-2 shadow-sm">
      <ul className="flex space-x-6">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive
                    ? "text-blue-600 font-semibold underline"
                    : "text-gray-700 hover:text-blue-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavMenu;
