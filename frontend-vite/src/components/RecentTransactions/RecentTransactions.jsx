// src/components/RecentTransactions/RecentTransactions.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import styles from "./RecentTransactions.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown } from "@fortawesome/free-solid-svg-icons";

const ITEMS_PER_PAGE = 5;

const RecentTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const initialLoadAttempted = useRef(false);

  // console.log('Component Rendered - isLoading:', isLoading, 'currentPage:', currentPage, 'transactions:', transactions.length, 'hasMore:', hasMore, 'initialLoadAttempted:', initialLoadAttempted.current);

  const fetchTransactionsAPI = useCallback(
    async (pageToFetch, isInitialCall = false) => {
      // console.log(`fetchTransactionsAPI called for page: ${pageToFetch}, isInitialCall: ${isInitialCall}, current isLoading: ${isLoading}`);
      if (isLoading && !isInitialCall) {
        // console.log("Fetch blocked: Already loading (not initial call).");
        return;
      }
      setIsLoading(true);
      if (isInitialCall || pageToFetch === 1) {
        setError("");
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Bạn chưa đăng nhập. Vui lòng đăng nhập.");
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/transactions?page=${pageToFetch}&limit=${ITEMS_PER_PAGE}&sortBy=date&order=desc`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newItems =
          response.data.transactions || response.data.data || response.data;
        const totalPagesFromAPI = response.data.totalPages;

        if (newItems && Array.isArray(newItems)) {
          if (newItems.length > 0) {
            setTransactions((prevItems) => {
              if (pageToFetch === 1) {
                // console.log("Setting initial transactions:", newItems);
                return [...newItems]; // Thay thế hoàn toàn cho trang đầu tiên
              } else {
                // Lọc ra các mục mới thực sự chưa có trong danh sách cũ dựa trên ID
                const existingIds = new Set(
                  prevItems.map((item) => item.id || item._id)
                );
                const trulyNewItems = newItems.filter(
                  (item) => !existingIds.has(item.id || item._id)
                );
                // console.log("Prev items count:", prevItems.length);
                // console.log("New items from API:", newItems.length, "Truly new items:", trulyNewItems.length);
                if (trulyNewItems.length === 0 && newItems.length > 0) {
                  // API trả về dữ liệu nhưng tất cả đều đã có, có thể là trang cuối cùng đã được tải hết
                  // hoặc API đang trả về dữ liệu không đúng cách.
                  // console.log("API returned existing items, considering it as no more new data for this page.");
                  // setHasMore(false); // Cập nhật hasMore ở ngoài nếu cần dựa trên logic này
                }
                return [...prevItems, ...trulyNewItems];
              }
            });
            setCurrentPage(pageToFetch);

            if (totalPagesFromAPI !== undefined) {
              setHasMore(pageToFetch < totalPagesFromAPI);
            } else {
              // Nếu không có totalPagesFromAPI, kiểm tra xem newItems có đủ số lượng không
              // Hoặc nếu newItems rỗng thì chắc chắn không còn nữa
              setHasMore(newItems.length === ITEMS_PER_PAGE);
            }
          } else {
            // newItems là mảng rỗng
            setHasMore(false);
            if (pageToFetch === 1) setTransactions([]);
          }
        } else {
          console.warn("API did not return a valid array of transactions.");
          setHasMore(false);
          if (pageToFetch === 1) setTransactions([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải giao dịch:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Không thể tải danh sách giao dịch. Vui lòng thử lại.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, isLoading]
  );

  useEffect(() => {
    if (!initialLoadAttempted.current) {
      initialLoadAttempted.current = true;
      setTransactions([]);
      setCurrentPage(0);
      setHasMore(true);
      setError("");
      fetchTransactionsAPI(1, true);
    }
  }, [fetchTransactionsAPI]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactionsAPI(currentPage + 1, false);
    }
  };

  const handleViewDetails = () => {
    navigate("/transactions");
  };

  const handleDeleteTransaction = (deletedTransactionId) => {
    setTransactions((prevItems) =>
      prevItems.filter((item) => (item.id || item._id) !== deletedTransactionId)
    );
  };

  let content;
  if (isLoading && transactions.length === 0 && currentPage === 0 && !error) {
    content = (
      <div className={styles.loadingIndicator}>
        <FontAwesomeIcon icon={faSpinner} spin size="lg" />
        <span>Đang tải giao dịch...</span>
      </div>
    );
  } else if (error && transactions.length === 0) {
    content = (
      <p className={`${styles.errorText} ${styles.noTransactions}`}>{error}</p>
    );
  } else if (!isLoading && transactions.length === 0 && !error) {
    content = <p className={styles.noTransactions}>Chưa có giao dịch nào.</p>;
  } else {
    content = (
      <div className={styles.tableWrapper}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Danh mục</th>
              <th>Mô tả</th>
              <th>Phương thức TT</th>
              <th className={styles.amountHeader}>Số tiền</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id || transaction._id}
                transaction={transaction}
                onDeleteSuccess={handleDeleteTransaction}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.recentTransactionsContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Giao dịch gần đây</h3>
        <button
          onClick={handleViewDetails}
          className={styles.viewDetailsButton}
        >
          Xem chi tiết
        </button>
      </div>
      {content}
      {error && transactions.length > 0 && !isLoading && (
        <p className={styles.errorText}>{error}</p>
      )}
      <div className={styles.loadMoreButtonOuterContainer}>
        {hasMore && !error && transactions.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={styles.loadMoreButton}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className={styles.loadMoreIcon}
                />{" "}
                Đang tải...
              </>
            ) : (
              <>
                Tải thêm{" "}
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={styles.loadMoreIcon}
                />
              </>
            )}
          </button>
        )}
      </div>
      {!hasMore && transactions.length > 0 && !isLoading && !error && (
        <p className={styles.noMoreTransactions}>
          Đã hiển thị tất cả giao dịch.
        </p>
      )}
    </div>
  );
};

export default RecentTransactions;
