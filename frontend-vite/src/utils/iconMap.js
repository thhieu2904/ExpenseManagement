// src/utils/iconMap.js (hoặc đặt trong CategoryList.jsx nếu muốn)
import {
  faUtensils,
  faShoppingCart,
  faCar,
  faHome,
  faFileInvoiceDollar,
  faMoneyBillWave,
  faGift,
  faPiggyBank,
  faBriefcase,
  faBus,
  faTshirt,
  faGasPump,
  faHeartbeat,
  faBook,
  faGraduationCap,
  faPaw,
  faPlane,
  faTrain,
  faHospital,
  faFilm,
  faMusic,
  faGamepad,
  faQuestionCircle,
  faPlusCircle,
  faMinusCircle,
  faReceipt,
  faHandHoldingUsd,
  faWallet,
  faCreditCard,
  faLandmark,
  faTools,
  faLightbulb,
  faBolt,
  faWifi,
  faMobileAlt,
  faTv,
  faBaby,
  faGlassCheers,
  faStore,
  faTree,
  faSeedling,
  // Thêm các icon bạn thấy cần thiết từ @fortawesome/free-solid-svg-icons
  // và @fortawesome/free-brands-svg-icons (nếu cần)
} from "@fortawesome/free-solid-svg-icons";

export const iconMap = {
  // Thu nhập
  "fa-money-bill-wave": faMoneyBillWave, // Lương
  "fa-gift": faGift, // Quà tặng, Thưởng
  "fa-hand-holding-usd": faHandHoldingUsd, // Thu nhập khác, Đầu tư
  "fa-piggy-bank": faPiggyBank, // Tiết kiệm (nếu coi là một dạng "thu" vào tiết kiệm)

  // Chi tiêu - Ăn uống
  "fa-utensils": faUtensils, // Ăn uống, Nhà hàng
  "fa-shopping-cart": faShoppingCart, // Đi chợ, Thực phẩm

  // Chi tiêu - Di chuyển
  "fa-car": faCar, // Xe cộ, Xăng dầu
  "fa-gas-pump": faGasPump, // Xăng dầu
  "fa-bus": faBus, // Phương tiện công cộng
  "fa-train": faTrain, // Tàu hỏa
  "fa-plane": faPlane, // Máy bay, Du lịch

  // Chi tiêu - Nhà cửa
  "fa-home": faHome, // Nhà cửa, Tiền thuê
  "fa-file-invoice-dollar": faFileInvoiceDollar, // Hóa đơn (điện, nước, internet)
  "fa-bolt": faBolt, // Điện
  "fa-wifi": faWifi, // Internet
  "fa-tools": faTools, // Sửa chữa nhà cửa

  // Chi tiêu - Cá nhân & Mua sắm
  "fa-tshirt": faTshirt, // Quần áo
  "fa-store": faStore, // Mua sắm chung
  "fa-mobile-alt": faMobileAlt, // Điện thoại, Cước điện thoại

  // Chi tiêu - Sức khỏe & Giáo dục
  "fa-heartbeat": faHeartbeat, // Sức khỏe, Thuốc men
  "fa-hospital": faHospital, // Bệnh viện, Khám bệnh
  "fa-book": faBook, // Sách vở
  "fa-graduation-cap": faGraduationCap, // Giáo dục, Học phí

  // Chi tiêu - Giải trí & Khác
  "fa-film": faFilm, // Giải trí, Xem phim
  "fa-music": faMusic, // Âm nhạc
  "fa-gamepad": faGamepad, // Trò chơi
  "fa-glass-cheers": faGlassCheers, // Bạn bè, Tụ tập
  "fa-paw": faPaw, // Thú cưng
  "fa-tree": faTree, // Từ thiện (ví dụ)
  "fa-seedling": faSeedling, // Làm vườn, sở thích

  // Giao dịch & Tài khoản
  "fa-receipt": faReceipt, // Giao dịch, Hóa đơn chung
  "fa-wallet": faWallet, // Ví tiền
  "fa-credit-card": faCreditCard, // Thẻ tín dụng/ghi nợ
  "fa-landmark": faLandmark, // Ngân hàng

  // Mặc định & Thêm/Bớt
  "fa-plus-circle": faPlusCircle, // Thêm mới
  "fa-minus-circle": faMinusCircle, // Bớt, Xóa
  default: faQuestionCircle, // Icon mặc định
  // ... bạn có thể thêm nhiều icon khác từ thư viện FontAwesome
};

export const getIconObject = (iconName) => {
  return iconMap[iconName] || iconMap["default"];
};

// Bạn có thể tạo một danh sách các icon để người dùng chọn khi tạo/sửa danh mục
export const availableIconsForSelection = [
  { name: "Lương", identifier: "fa-money-bill-wave" },
  { name: "Quà tặng", identifier: "fa-gift" },
  { name: "Ăn uống", identifier: "fa-utensils" },
  { name: "Đi chợ", identifier: "fa-shopping-cart" },
  { name: "Xe cộ", identifier: "fa-car" },
  { name: "Nhà cửa", identifier: "fa-home" },
  { name: "Hóa đơn", identifier: "fa-file-invoice-dollar" },
  { name: "Quần áo", identifier: "fa-tshirt" },
  { name: "Sức khỏe", identifier: "fa-heartbeat" },
  { name: "Giáo dục", identifier: "fa-graduation-cap" },
  { name: "Giải trí", identifier: "fa-film" },
  { name: "Ví tiền", identifier: "fa-wallet" },
  { name: "Thẻ", identifier: "fa-credit-card" },
  // ... thêm các icon bạn muốn người dùng có thể chọn
];
