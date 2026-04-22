// Configuration
const CONFIG = {
  // ⚠️ IMPORTANT: Set this to false when you have updated the Backend ⚠️
  USE_MOCK_DATA: false,

  // Your actual backend URL
  BACKEND_URL: "https://main-project-backend-lu62.onrender.com",

  POLL_INTERVAL: 10000, // 10 seconds
};

// ----------------------
// Mock Data (For demonstration)
// ----------------------
const MOCK_DB = {
  stocks: [
    { product_id: 100, name: "Marie Gold", price: 10, stock_count: 45 },
    { product_id: 101, name: "Cinthol", price: 70, stock_count: 12 },
    { product_id: 102, name: "Gloves", price: 200, stock_count: 5 },
    { product_id: 103, name: "Coco Cola", price: 40, stock_count: 89 },
    { product_id: 104, name: "Elite Brownie", price: 20, stock_count: 0 },
    { product_id: 105, name: "Coconut Oil", price: 30, stock_count: 23 },
    { product_id: 106, name: "Shampoo", price: 100, stock_count: 15 },
    { product_id: 107, name: "Pen", price: 5, stock_count: 120 },
    { product_id: 108, name: "Note Book", price: 50, stock_count: 40 },
    { product_id: 109, name: "Water Bottle", price: 20, stock_count: 8 },
  ],
  transactions: [
    {
      transaction_id: "ORD-001",
      customer: "Alex Johnson",
      item: "Cinthol (x2)",
      date: "2023-10-24T10:30:00",
      amount: 140.0,
      status: "Paid",
      cart_id: "CART-A1",
      items: [{ name: "Cinthol", qty: 2, price: 70 }],
    },
    {
      transaction_id: "ORD-002",
      customer: "Sarah Smith",
      item: "Notebook, Pen",
      date: "2023-10-22T14:15:00",
      amount: 55.0,
      status: "Paid",
      cart_id: "CART-B2",
      items: [
        { name: "Pen", qty: 1, price: 5 },
        { name: "Note Book", qty: 1, price: 50 },
      ],
    },
    {
      transaction_id: "ORD-003",
      customer: "Michael Brown",
      item: "Gloves",
      date: "2023-10-21T09:45:00",
      amount: 200.0,
      status: "Pending",
      cart_id: "CART-C3",
      items: [{ name: "Gloves", qty: 1, price: 200 }],
    },
    {
      transaction_id: "ORD-004",
      customer: "Emily Davis",
      item: "Marie Gold",
      date: "2023-10-20T16:20:00",
      amount: 40.0,
      status: "Failed",
      cart_id: "CART-D4",
      items: [{ name: "Marie Gold", qty: 4, price: 10 }],
    },
    {
      transaction_id: "ORD-005",
      customer: "David Wilson",
      item: "Coco Cola",
      date: "2023-10-18T11:10:00",
      amount: 120.0,
      status: "Paid",
      cart_id: "CART-E5",
      items: [{ name: "Coco Cola", qty: 3, price: 40 }],
    },
  ],
};

// ----------------------
// State Management
// ----------------------
let state = {
  stocks: [],
  transactions: [],
  recentTransactions: [],
  filterDate: null,
  statusFilter: "all",
  inventorySearch: "",
  transactionSearch: "",
};

// ----------------------
// Initialization
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  // initApp(); // Moved to after login
  setupLogin();
});

function setupLogin() {
  const loginBtn = document.getElementById("login-btn");
  const passwordInput = document.getElementById("admin-password");
  const errorMsg = document.getElementById("login-error");

  function attemptLogin() {
    const password = passwordInput.value;
    if (password === "admin@123") {
      document.getElementById("login-screen").classList.add("hidden");
      // document.getElementById("app-container").classList.remove("hidden");
      const app = document.getElementById("app-container");
      app.classList.remove("hidden");
      app.style.display = "flex";
      initApp(); // Start app only after login
    } else {
      errorMsg.classList.remove("hidden");
      passwordInput.style.borderColor = "var(--danger-color)";
      // Shake effect
      const card = document.querySelector(".login-card");
      card.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-10px)" },
          { transform: "translateX(10px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 300 },
      );
    }
  }

  loginBtn.addEventListener("click", attemptLogin);

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") attemptLogin();
  });

  passwordInput.addEventListener("input", () => {
    errorMsg.classList.add("hidden");
    passwordInput.style.borderColor = "#cbd5e1";
  });
}

function initApp() {
  setupNavigation();
  setupEventListeners();
  fetchData(); // Initial Fetch

  // Real-time updates (Polling)
  setInterval(fetchData, CONFIG.POLL_INTERVAL);
}

// ----------------------
// Data Fetching
// ----------------------

function processTransactions(rawTxns) {
  const grouped = {};
  rawTxns.forEach((row) => {
    if (!grouped[row.purchase_id]) {
      grouped[row.purchase_id] = {
        transaction_id: row.purchase_id,
        date: row.created_at,
        items: [],
        amount: 0,
        status: "Paid", // Default status as they are completed purchases
      };
    }
    grouped[row.purchase_id].items.push({
      name: row.product_name,
      qty: row.quantity,
      price: row.price,
    });
    grouped[row.purchase_id].amount += row.price * row.quantity;
  });

  return Object.values(grouped).map((txn) => {
    txn.item = txn.items.map((i) => `${i.name}`).join(", ");
    return txn;
  });
}

async function fetchData() {
  updateLastUpdatedTime();

  if (CONFIG.USE_MOCK_DATA) {
    // Simulate API delay
    console.log("Fetching Mock Data...");
    state.stocks = [...MOCK_DB.stocks];
    state.transactions = [...MOCK_DB.transactions];
    state.recentTransactions = [...MOCK_DB.transactions].slice(0, 5);
    renderAll();
  } else {
      // Fetch each endpoint independently so one failure doesn't block the rest
    try {
      const stockRes = await fetch(`${CONFIG.BACKEND_URL}/api/admin/stocks`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        state.stocks = stockData.stocks || [];
      }
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    }

    try {
      const txnRes = await fetch(`${CONFIG.BACKEND_URL}/api/admin/transactions`);
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        state.transactions = processTransactions(txnData.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }

    try {
      const recentTxnRes = await fetch(`${CONFIG.BACKEND_URL}/api/admin/transactions/recent`);
      if (recentTxnRes.ok) {
        const recentTxnData = await recentTxnRes.json();
        state.recentTransactions = processTransactions(recentTxnData.transactions || []);
      } else {
        state.recentTransactions = [...state.transactions].slice(0, 5);
      }
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
      state.recentTransactions = [...state.transactions].slice(0, 5);
    }

    renderAll();
  }
}

// ----------------------
// Rendering
// ----------------------
function renderAll() {
  renderDashboardStats();
  renderInventory();
  renderTransactions();
  renderRecentActivity();
}

function renderDashboardStats() {
  // Calculate Stats
  const totalSales = state.transactions.reduce((sum, t) => sum + t.amount, 0);
  const lowStockCount = state.stocks.filter((s) => s.stock_count < 10).length;

  // Update DOM
  document.getElementById("total-sales").textContent =
    `₹${totalSales.toFixed(2)}`;
  document.getElementById("total-transactions").textContent =
    state.transactions.length;
  document.getElementById("low-stock-count").textContent = lowStockCount;
}

function renderInventory() {
  const tbody = document.getElementById("inventory-body");
  tbody.innerHTML = "";

  // Filter
  const filtered = state.stocks.filter(
    (item) =>
      item.name.toLowerCase().includes(state.inventorySearch.toLowerCase()) ||
      item.product_id.toString().includes(state.inventorySearch),
  );

  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>#${item.product_id}</td>
            <td><strong>${item.name}</strong></td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.stock_count}</td>
        `;
    tbody.appendChild(tr);
  });
}

function renderTransactions() {
  const tbody = document.getElementById("transactions-body");
  tbody.innerHTML = "";

  // Filter by Date, Status & Search
  let filtered = state.transactions.filter((txn) => {
    const matchesSearch =
      txn.transaction_id
        .toLowerCase()
        .includes(state.transactionSearch.toLowerCase()) ||
      (txn.item && txn.item.toLowerCase().includes(state.transactionSearch.toLowerCase()));

    const matchesStatus =
      state.statusFilter === "all" || txn.status === state.statusFilter;

    let matchesDate = true;
    if (state.filterDate) {
      const txnDate = new Date(txn.date).toISOString().split("T")[0];
      matchesDate = txnDate === state.filterDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort by Date Descending
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach((txn) => {
    const dateObj = new Date(txn.date);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td><span style="font-weight:600;">${txn.transaction_id}</span></td>
            <td><span style="font-family:monospace; color:var(--text-muted);">${txn.transaction_id}</span></td>
            <td>${txn.item}</td>
            <td>${dateStr}</td>
            <td style="font-weight:600;">₹${txn.amount.toFixed(2)}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button class="icon-btn" onclick="openTransactionModal('${txn.transaction_id}')" title="View Details">
                        <i class="fas fa-eye" style="font-size:0.9rem;"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(tr);
  });

  // Update pagination info
  const paginationInfo = document.getElementById("pagination-info");
  if (paginationInfo) {
    const total = filtered.length;
    paginationInfo.textContent = total > 0
      ? `Showing 1 to ${total} of ${total} entries`
      : `No entries found`;
  }
}

function renderRecentActivity() {
  const tbody = document.getElementById("recent-activity-body");
  tbody.innerHTML = "";

  const recent = state.recentTransactions && state.recentTransactions.length > 0 
    ? state.recentTransactions 
    : [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  recent.forEach((txn) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${new Date(txn.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</td>
            <td>New purchase : <strong>${txn.transaction_id}</strong></td>
            <td><span style="font-weight:600;">₹${txn.amount.toFixed(2)}</span></td>
            <td><span class="badge badge-primary" style="scale:0.9;">${txn.items ? txn.items.length : 0} Products</span></td>
        `;
    tbody.appendChild(tr);
  });
}

// ----------------------
// Interaction Logic
// ----------------------
function setupNavigation() {
  const links = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view-section");
  const title = document.getElementById("page-title");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // UI Toggle
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // View Switch
      const targetId = link.getAttribute("data-tab");
      views.forEach((v) => v.classList.remove("active"));
      const viewEl = document.getElementById(`${targetId}-view`);
      if (viewEl) viewEl.classList.add("active");

      // Title Update
      if (targetId === "dashboard") title.textContent = "Dashboard Overview";
      if (targetId === "inventory") title.textContent = "Stock Inventory";
      if (targetId === "transactions") title.textContent = "Transaction History";
      if (targetId === "update-stock") title.textContent = "Update Stock";

      if (targetId === "inventory" || targetId === "transactions") {
        fetchData();
      }
    });
  });
}

function setupEventListeners() {
  // Refresh Button
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      const icon = document.querySelector("#refresh-btn i");
      icon.classList.add("fa-spin");
      fetchData().then(() => {
        setTimeout(() => icon.classList.remove("fa-spin"), 500);
      });
    });
  }

  // Inventory Search
  const invSearch = document.getElementById("inventory-search");
  if (invSearch) {
    invSearch.addEventListener("input", (e) => {
      state.inventorySearch = e.target.value;
      renderInventory();
    });
  }

  // Transaction Search
  const txnSearch = document.getElementById("transaction-search");
  if (txnSearch) {
    txnSearch.addEventListener("input", (e) => {
      state.transactionSearch = e.target.value;
      renderTransactions();
    });
  }

  // Status Filter
  const statusFilter = document.getElementById("status-filter");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      state.statusFilter = e.target.value;
      renderTransactions();
    });
  }

  // Date Filter
  const dateFilter = document.getElementById("date-filter");
  if (dateFilter) {
    dateFilter.addEventListener("change", (e) => {
      state.filterDate = e.target.value; // YYYY-MM-DD
      renderTransactions();
    });
  }

  // Clear Date Button (if exists)
  const clearDateBtn = document.getElementById("clear-date-btn");
  if (clearDateBtn) {
    clearDateBtn.addEventListener("click", () => {
      if (dateFilter) dateFilter.value = "";
      state.filterDate = null;
      renderTransactions();
    });
  }

  const updateForm = document.getElementById("update-stock-form");
  if (updateForm) {
    updateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const productId = parseInt(document.getElementById("product-id-input").value);
      const name = document.getElementById("product-name-input").value.trim();
      const price = parseFloat(document.getElementById("product-price-input").value);
      const count = parseInt(document.getElementById("product-count-input").value);
      
      const payload = {
        product_id: productId,
        name: name,
        price: price,
        number: count
      };

      const btn = updateForm.querySelector("button[type='submit']");
      const originalText = btn.textContent;
      btn.textContent = "Saving...";
      btn.disabled = true;

      const statusEl = document.getElementById("stock-form-status");
      statusEl.classList.add("hidden");
      statusEl.classList.remove("success", "error");

      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/stocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          statusEl.textContent = data.message || "Stock updated successfully";
          statusEl.classList.add("success");
          statusEl.classList.remove("hidden");
          showToast(data.message || "Stock updated successfully", "success");
          updateForm.reset();
          fetchData(); // Optionally refetch
        } else {
          const detail = data.detail || "An error occurred";
          statusEl.textContent = detail;
          statusEl.classList.add("error");
          statusEl.classList.remove("hidden");
          showToast(detail, "error");
        }
      } catch (err) {
        statusEl.textContent = "Network error while saving stock";
        statusEl.classList.add("error");
        statusEl.classList.remove("hidden");
        showToast("Network error", "error");
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Modal Close
  const closeModalBtn = document.getElementById("close-modal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") closeModal();
    });
  }
}

// ----------------------
// Helpers
// ----------------------
function updateLastUpdatedTime() {
  const now = new Date();
  document.getElementById("last-updated").textContent =
    `Updated: ${now.toLocaleTimeString()}`;
}

window.openTransactionModal = function (txnId) {
  const txn = state.transactions.find((t) => t.transaction_id === txnId);
  if (!txn) return;

  const modalContent = document.getElementById("modal-content");
  const dateObj = new Date(txn.date);

  let itemsHtml = "";
  txn.items.forEach((item) => {
    itemsHtml += `
            <div class="modal-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <span>${item.name} <span style="color:#94a3b8">x${item.qty}</span></span>
                <span>₹${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `;
  });

  modalContent.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px;">
            <div>
                <span style="display:block; font-size:0.8rem; color:#64748b; margin-bottom:4px;">Date</span>
                <span style="font-weight:600;">${dateObj.toLocaleDateString()}</span>
            </div>
            <div>
                <span style="display:block; font-size:0.8rem; color:#64748b; margin-bottom:4px;">Time</span>
                <span style="font-weight:600;">${dateObj.toLocaleTimeString()}</span>
            </div>
            <div>
                <span style="display:block; font-size:0.8rem; color:#64748b; margin-bottom:4px;">Purchase ID</span>
                <span style="font-weight:600;">${txn.transaction_id}</span>
            </div>
             <div>
                <span style="display:block; font-size:0.8rem; color:#64748b; margin-bottom:4px;">Total Items</span>
                <span class="badge badge-success" style="padding:4px 8px; font-size:0.8rem;">${txn.items.length} Products</span>
            </div>
        </div>

        <div style="background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:24px;">
            <p style="font-size:0.9rem; font-weight:600; color:#cbd5e1; margin-bottom:12px; text-transform:uppercase;">Items Purchased</p>
            ${itemsHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:16px; border-top:1px dashed #cbd5e1;">
            <span style="font-size:1.1rem; font-weight:600;">Total Amount</span>
            <span style="font-size:1.4rem; font-weight:700; color:var(--accent-color);">₹${txn.amount.toFixed(2)}</span>
        </div>
    `;

  document.getElementById("modal-overlay").classList.remove("hidden");
};

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger reflow
  void toast.offsetWidth;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
