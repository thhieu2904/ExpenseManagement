import React, { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "./StatCard";
import { Wallet, ArrowDown, ArrowUp } from "lucide-react";
import dayjs from "dayjs";

const StatsCards = () => {
  const [income, setIncome] = useState(0);
  const [prevIncome, setPrevIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [prevExpense, setPrevExpense] = useState(0);
  const [balance, setBalance] = useState(0);

  const token = localStorage.getItem("token");
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(
          `http://localhost:5000/api/transactions/summary?month=${currentMonth}&year=${currentYear}`,
          { headers }
        );
        const resPrev = await axios.get(
          `http://localhost:5000/api/transactions/summary?month=${
            currentMonth - 1
          }&year=${currentYear}`,
          { headers }
        );

        setIncome(res.data.income);
        setExpense(res.data.expense);
        setPrevIncome(resPrev.data.income);
        setPrevExpense(resPrev.data.expense);

        const accRes = await axios.get("http://localhost:5000/api/accounts", {
          headers,
        });
        const totalBalance = accRes.data.reduce(
          (sum, acc) => sum + acc.initialBalance,
          0
        );
        setBalance(totalBalance);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu StatsCards:", err);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="flex flex-wrap gap-4 px-6 pb-4">
      <StatCard
        title={`Thu nhập - Tháng ${currentMonth}`}
        value={income}
        prevValue={prevIncome}
        icon={ArrowDown}
        color="green"
      />
      <StatCard
        title={`Chi tiêu - Tháng ${currentMonth}`}
        value={expense}
        prevValue={prevExpense}
        icon={ArrowUp}
        color="red"
      />
      <StatCard
        title="Số dư hiện tại"
        value={balance}
        prevValue={null}
        icon={Wallet}
        color="blue"
      />
    </div>
  );
};

export default StatsCards;
