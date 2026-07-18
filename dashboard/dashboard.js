//Data
let expenses = [];
let budget = 0;
let savings = [];
let editIndex = -1;
let pieChartInstance = null;
let barChartInstance = null;
let categories = ["Food", "Travel", "Shopping", "Bills", "Entertainment"];

// Make currentUser globally available
window.currentUser = null;

// ── FIREBASE AUTH CHECK ──
window.addEventListener("firebaseReady", () => {
  const { onAuthStateChanged, doc, getDoc } = window.firebaseFns;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    window.currentUser = user;

    //Data
    expenses = [];
    budget = 0;
    savings = [];
    categories = ["Food", "Travel", "Shopping", "Bills", "Entertainment"];

    // Clear UI
    document.getElementById("list").innerHTML = "";
    document.getElementById("recentList").innerHTML = "";
    document.getElementById("savingsList").innerHTML = "";
    document.getElementById("totalExpense").textContent = "₹0";
    document.getElementById("totalBudget").textContent = "₹0";
    document.getElementById("totalSavings").textContent = "₹0";
    document.getElementById("totalTransactions").textContent = "0";
    document.getElementById("budgetAmount").textContent = "₹0";
    document.getElementById("budgetSpent").textContent = "₹0";
    document.getElementById("budgetRemaining").textContent = "₹0";

    // Get user name from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        document.getElementById("userName").innerHTML =
          `<i class="fas fa-user-circle"></i> ${userData.name}`;
      }
    } catch (error) {
      console.error("Error getting user:", error);
    }

    // Load dark mode first
    loadDarkModePreference();

    // Load ALL data from Firestore
    await loadAllDataFromFirestore();

    // Render everything
    renderCategoryOptions();
    renderExpenses();
    updateDashboardOverview();
    updateBudget();
    renderSavings();

    // 1. Explicit Search Action
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", renderExpenses);
    }

    // 2. Smart Reset: Update list immediately when a user clears a specific filter
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        if (e.target.value.trim() === "") renderExpenses();
      });
    }

    const filterCategory = document.getElementById("filterCategory");
    if (filterCategory) {
      filterCategory.addEventListener("change", (e) => {
        if (e.target.value === "") renderExpenses();
      });
    }

    const filterMonth = document.getElementById("filterMonth");
    if (filterMonth) {
      filterMonth.addEventListener("input", (e) => {
        if (e.target.value === "") renderExpenses();
      });
    }
  });
});

// ── FIRESTORE SAVE FUNCTIONS ──

async function saveExpensesToFirestore() {
  try {
    const { doc, setDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const uid = window.currentUser.uid;
    // Save directly to the user document using merge
    await setDoc(
      doc(db, "users", uid),
      { expenses: expenses },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving expenses:", error);
  }
}

async function saveBudgetToFirestore() {
  try {
    const { doc, setDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const uid = window.currentUser.uid;
    await setDoc(doc(db, "users", uid), { budget: budget }, { merge: true });
  } catch (error) {
    console.error("Error saving budget:", error);
  }
}

async function saveSavingsToFirestore() {
  try {
    const { doc, setDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const uid = window.currentUser.uid;
    await setDoc(doc(db, "users", uid), { savings: savings }, { merge: true });
  } catch (error) {
    console.error("Error saving savings:", error);
  }
}

async function saveCategoriesToFirestore() {
  try {
    const { doc, setDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const uid = window.currentUser.uid;
    await setDoc(
      doc(db, "users", uid),
      { categories: categories },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving categories:", error);
  }
}

// ── FIRESTORE LOAD ALL DATA ──
async function loadAllDataFromFirestore() {
  try {
    const { doc, getDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const uid = window.currentUser.uid;

    // Fetch the single root user document
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Extract data directly from the root fields, with fallbacks for new users
      expenses = userData.expenses || [];
      budget = userData.budget || 0;
      savings = userData.savings || [];
      categories = userData.categories || [
        "Food",
        "Travel",
        "Shopping",
        "Bills",
        "Entertainment",
      ];
    } else {
      // Fallback if document doesn't exist for some reason
      expenses = [];
      budget = 0;
      savings = [];
      categories = ["Food", "Travel", "Shopping", "Bills", "Entertainment"];
    }

    console.log("All data loaded from root user document");
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// ── CATEGORIES ──
function renderCategoryOptions() {
  const categorySelect = document.getElementById("category");
  const filterSelect = document.getElementById("filterCategory");

  categorySelect.innerHTML = `<option value="">Select Category</option>`;
  filterSelect.innerHTML = `<option value="">All Categories</option>`;

  categories.forEach((cat) => {
    categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function openAddCategoryPopup() {
  Swal.fire({
    title: "Add New Category",
    input: "text",
    inputPlaceholder: "Enter category name",
    showCancelButton: true,
    confirmButtonText: "Add",
    confirmButtonColor: "#3498db",
    cancelButtonColor: "#aaa",
    inputValidator: (value) => {
      if (!value || value.trim() === "") {
        return "Category name cannot be empty";
      }
      if (
        categories.some((c) => c.toLowerCase() === value.trim().toLowerCase())
      ) {
        return "This category already exists";
      }
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      const newCategory = result.value.trim();
      categories.push(newCategory);

      // ✅ Save to Firestore
      await saveCategoriesToFirestore();
      renderCategoryOptions();
      document.getElementById("category").value = newCategory;

      Swal.fire({
        icon: "success",
        title: "Category Added!",
        text: `"${newCategory}" has been added successfully.`,
        confirmButtonColor: "#3498db",
        timer: 2000,
        timerProgressBar: true,
      });
    }
  });
}

function openManageCategoryPopup() {
  if (categories.length === 0) {
    Swal.fire("No Categories", "You have no categories to manage.", "info");
    return;
  }

  const listHtml = categories
    .map(
      (cat) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
            <span>${cat}</span>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `,
    )
    .join("");

  Swal.fire({
    title: "Manage Categories",
    html: `<div style="text-align:left; max-height:300px; overflow-y:auto;">${listHtml}</div>`,
    showConfirmButton: false,
    showCloseButton: true,
  });
}

async function deleteCategory(catName) {
  const usedInExpenses = expenses.some((e) => e.category === catName);

  if (usedInExpenses) {
    Swal.fire({
      icon: "warning",
      title: "Cannot Delete",
      text: `"${catName}" is used in existing expenses. Delete or edit those expenses first.`,
      confirmButtonColor: "#3498db",
    });
    return;
  }

  categories = categories.filter((c) => c !== catName);

  // ✅ Save to Firestore
  await saveCategoriesToFirestore();
  renderCategoryOptions();

  Swal.fire({
    icon: "success",
    title: "Category Deleted",
    text: `"${catName}" has been removed.`,
    timer: 1500,
    showConfirmButton: false,
  }).then(() => {
    openManageCategoryPopup();
  });
}

// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("active");
  } else {
    sidebar.classList.toggle("collapsed");
    document.getElementById("mainContent").classList.toggle("collapsed");
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.remove("mobile-open");
  overlay.classList.remove("active");
}

// ── SHOW SECTION ──
function showSection(section) {
  document.querySelectorAll(".section").forEach((s) => {
    s.classList.add("d-none");
  });

  document.querySelectorAll(".sidebar-menu li a").forEach((a) => {
    a.classList.remove("active");
  });

  document.getElementById(section + "Section").classList.remove("d-none");

  const titles = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    budget: "Budget",
    savings: "Savings",
    reports: "Reports",
  };
  document.getElementById("pageTitle").textContent = titles[section];

  event.target.closest("a").classList.add("active");

  if (section === "reports") updateCharts();
  if (section === "dashboard") updateDashboardOverview();

  // Close sidebar on mobile
  closeSidebar();
}

// ── LOGOUT ──
async function logoutUser() {
  const { signOut } = window.firebaseFns;
  const auth = window.firebaseAuth;
  try {
    // 👇 Clear all data before logout
    expenses = [];
    budget = 0;
    savings = [];
    categories = ["Food", "Travel", "Shopping", "Bills", "Entertainment"];
    window.currentUser = null;

    await signOut(auth);
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ── ADD EXPENSE ──
async function addExpenses() {
  const title = document.getElementById("title").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (title.trim() === "" || amount <= 0 || category === "" || date === "") {
    alert("Please fill all fields");
    return;
  }

  const expense = { title, amount, category, date };

  if (editIndex === -1) {
    expenses.push(expense);
  } else {
    expenses[editIndex] = expense;
    editIndex = -1;
    document.getElementById("submitBtn").textContent = "Add Expense";
  }

  // ✅ Save to Firestore
  await saveExpensesToFirestore();

  renderExpenses();
  updateDashboardOverview();
  updateBudget();

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("date").value = "";
}

// ── RENDER EXPENSES ──
function renderExpenses() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const filterValue = document.getElementById("filterCategory").value;
  const filterMonth = document.getElementById("filterMonth").value;

  const filtered = expenses.filter((expense) => {
    const matchSearch = expense.title.toLowerCase().includes(searchValue);
    const matchCategory =
      filterValue === "" || expense.category === filterValue;
    const matchMonth =
      filterMonth === "" || expense.date.startsWith(filterMonth);
    return matchSearch && matchCategory && matchMonth;
  });

  if (filtered.length === 0) {
    list.innerHTML =
      "<li class='list-group-item text-center text-muted'>No expenses found</li>";
    return;
  }

  filtered.forEach((expense) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
        <div>
            <strong>${expense.title}</strong><br>
            <small class="text-muted">₹${expense.amount} | ${expense.category} | ${expense.date}</small>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-warning btn-sm" onclick="editExpense(${expenses.indexOf(expense)})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expenses.indexOf(expense)})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        `;

    list.appendChild(li);
  });
}

// ── EDIT EXPENSE ──
function editExpense(index) {
  const expense = expenses[index];
  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("date").value = expense.date;
  editIndex = index;
  document.getElementById("submitBtn").textContent = "Update Expense";
  showSection("transactions");
}

// ── DELETE EXPENSE ──
async function deleteExpense(index) {
  expenses.splice(index, 1);

  // ✅ Save to Firestore
  await saveExpensesToFirestore();

  renderExpenses();
  updateDashboardOverview();
  updateBudget();
}

// ── DASHBOARD OVERVIEW ──
function updateDashboardOverview() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById("totalExpense").textContent = `₹${total}`;
  document.getElementById("totalBudget").textContent = `₹${budget}`;
  document.getElementById("totalTransactions").textContent = expenses.length;

  const totalSaved = savings.reduce((sum, s) => sum + s.saved, 0);
  document.getElementById("totalSavings").textContent = `₹${totalSaved}`;

  const recentList = document.getElementById("recentList");
  recentList.innerHTML = "";
  const recent = [...expenses].reverse().slice(0, 5);

  if (recent.length === 0) {
    recentList.innerHTML =
      "<li class='list-group-item text-center text-muted'>No transactions yet</li>";
    return;
  }

  recent.forEach((expense) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";
    li.innerHTML = `
        <span><strong>${expense.title}</strong> — ${expense.category}</span>
        <span class="text-danger fw-bold">-₹${expense.amount}</span>
        `;
    recentList.appendChild(li);
  });
}

// ── BUDGET ──
async function setBudget() {
  const input = Number(document.getElementById("budgetInput").value);
  if (input <= 0) {
    alert("Please enter a valid budget amount");
    return;
  }
  budget = input;

  // ✅ Save to Firestore
  await saveBudgetToFirestore();

  document.getElementById("budgetInput").value = "";
  updateBudget();
  updateDashboardOverview();
}

function updateBudget() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  let spent = 0;
  expenses.forEach((expense) => {
    if (expense.date.startsWith(currentMonth)) spent += expense.amount;
  });

  const remaining = budget - spent;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  document.getElementById("budgetAmount").textContent = `₹${budget}`;
  document.getElementById("budgetSpent").textContent = `₹${spent}`;
  document.getElementById("budgetRemaining").textContent = `₹${remaining}`;

  const progress = document.getElementById("progress");
  progress.style.width = `${Math.min(percentage, 100)}%`;

  if (percentage >= 100) {
    progress.className = "progress-bar bg-danger";
  } else if (percentage >= 80) {
    progress.className = "progress-bar bg-warning";
  } else {
    progress.className = "progress-bar bg-success";
  }

  const budgetAlertEl = document.getElementById("budgetAlert");
  if (budget === 0) {
    budgetAlertEl.textContent = "";
  } else if (percentage >= 100) {
    budgetAlertEl.textContent = "⚠️ Budget Exceeded!";
    budgetAlertEl.style.color = "red";
  } else if (percentage >= 80) {
    budgetAlertEl.textContent = "⚠️ Warning! 80% budget used!";
    budgetAlertEl.style.color = "orange";
  } else {
    budgetAlertEl.textContent = `✅ ${Math.round(percentage)}% of budget used`;
    budgetAlertEl.style.color = "green";
  }
}

// ── SAVINGS ──
async function addSavingsGoal() {
  const title = document.getElementById("savingsTitle").value.trim();
  const target = Number(document.getElementById("savingsTarget").value);
  const saved = Number(document.getElementById("savingsSaved").value);
  const deadline = document.getElementById("savingsDeadline").value;

  if (title === "" || target <= 0 || deadline === "") {
    alert("Please fill all fields");
    return;
  }

  savings.push({ title, target, saved, deadline });

  // ✅ Save to Firestore
  await saveSavingsToFirestore();

  document.getElementById("savingsTitle").value = "";
  document.getElementById("savingsTarget").value = "";
  document.getElementById("savingsSaved").value = "";
  document.getElementById("savingsDeadline").value = "";

  renderSavings();
  updateDashboardOverview();
}

function renderSavings() {
  const savingsList = document.getElementById("savingsList");
  savingsList.innerHTML = "";

  if (savings.length === 0) {
    savingsList.innerHTML =
      "<p class='text-center text-muted'>No savings goals yet</p>";
    return;
  }

  savings.forEach((goal, index) => {
    const percentage = Math.min((goal.saved / goal.target) * 100, 100);
    const div = document.createElement("div");
    div.className = "card p-3 mb-3";
    div.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <h6>${goal.title}</h6>
            <button class="btn btn-danger btn-sm" onclick="deleteSavings(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="d-flex justify-content-between mb-1">
            <small>Saved: ₹${goal.saved}</small>
            <small>Target: ₹${goal.target}</small>
        </div>
        <div class="progress mb-1" style="height:10px;">
            <div class="progress-bar bg-success" style="width:${percentage}%"></div>
        </div>
        <small class="text-muted">Deadline: ${goal.deadline} | ${Math.round(percentage)}% complete</small>
        `;
    savingsList.appendChild(div);
  });
}

async function deleteSavings(index) {
  savings.splice(index, 1);

  // ✅ Save to Firestore
  await saveSavingsToFirestore();

  renderSavings();
  updateDashboardOverview();
}

// ── CHARTS ──
function updateCharts() {
  const chartCategories = [...categories];
  const categoryTotals = chartCategories.map((cat) =>
    expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  );

  const monthlyData = {};
  expenses.forEach((expense) => {
    const month = expense.date.slice(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
  });
  const months = Object.keys(monthlyData).sort();
  const monthlyTotals = months.map((m) => monthlyData[m]);

  if (pieChartInstance) pieChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  const pieCtx = document.getElementById("pieChart").getContext("2d");
  pieChartInstance = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: chartCategories,
      datasets: [
        {
          data: categoryTotals,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#C9CBCF",
            "#7BC8A4",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });

  const barCtx = document.getElementById("barChart").getContext("2d");
  barChartInstance = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Monthly Spending (₹)",
          data: monthlyTotals,
          backgroundColor: [
            "#36A2EB",
            "#9966FF",
            "#FF6384",
            "#FFCE56",
            "#4BC0C0",
          ],
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// ── DARK MODE ──
function toggleDarkMode() {
  const body = document.body;
  const icon = document.getElementById("darkModeIcon");

  body.classList.toggle("dark");

  if (body.classList.contains("dark")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
    localStorage.setItem("darkMode", "true");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    localStorage.setItem("darkMode", "false");
  }
}

function loadDarkModePreference() {
  const isDark = localStorage.getItem("darkMode");
  if (isDark === "true") {
    document.body.classList.add("dark");
    document.getElementById("darkModeIcon").classList.remove("fa-moon");
    document.getElementById("darkModeIcon").classList.add("fa-sun");
  }
}
