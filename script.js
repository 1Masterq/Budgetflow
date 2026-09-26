const STORAGE_KEY = "budgetflow-app";
const THEME_KEY = "budgetflow-theme";
const state = loadState();
const budgets = state.budgets;
let activeBudgetId = state.activeBudgetId || (budgets[0] ? budgets[0].id : null);
let activeBudget = budgets.find((entry) => entry.id === activeBudgetId) || budgets[0] || null;
let marketItems = activeBudget ? activeBudget.items : [];
let budget = activeBudget ? activeBudget.amount : 0;

const ui = {
  budgetInput: document.getElementById("budget"),
  budgetDisplay: document.getElementById("budgetDisplay"),
  spentDisplay: document.getElementById("spentDisplay"),
  remainingDisplay: document.getElementById("remainingDisplay"),
  percentage: document.getElementById("percentage"),
  progressBar: document.getElementById("progressBar"),
  budgetMessage: document.getElementById("budgetMessage"),
  budgetInsight: document.getElementById("budgetInsight"),
  itemInput: document.getElementById("item"),
  categoryInput: document.getElementById("category"),
  quantityInput: document.getElementById("quantity"),
  amountInput: document.getElementById("amount"),
  marketList: document.getElementById("marketList"),
  grandTotal: document.getElementById("grandTotal"),
  emptyMessage: document.getElementById("emptyMessage"),
  addButton: document.getElementById("addItemBtn"),
  setBudgetButton: document.getElementById("setBudgetBtn"),
  clearButton: document.getElementById("clearListBtn"),
  installButton: document.getElementById("installBtn"),
  themeToggle: document.getElementById("themeToggle"),
  homeView: document.getElementById("homeView"),
  dashboardView: document.getElementById("dashboardView"),
  openDashboardButton: document.getElementById("openDashboardBtn"),
  homeAddItemButton: document.getElementById("homeAddItemBtn"),
  homeViewAllButton: document.getElementById("homeViewAllBtn"),
  backHomeButton: document.getElementById("backHomeBtn"),
  createBudgetButton: document.getElementById("createBudgetBtn"),
  newBudgetNameInput: document.getElementById("newBudgetName"),
  newBudgetAmountInput: document.getElementById("newBudgetAmount"),
  savedBudgets: document.getElementById("savedBudgets"),
  budgetCount: document.getElementById("budgetCount"),
  activeBudgetName: document.getElementById("activeBudgetName"),
  itemCount: document.getElementById("itemCount"),
  sumTotal: document.getElementById("sumTotal"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
};

let deferredPrompt = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { budgets: [], activeBudgetId: null };
    }

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.budgets)) {
      return {
        budgets: parsed.budgets.map((entry) => ({
          id: String(entry.id),
          name: entry.name || "Untitled budget",
          amount: Number(entry.amount) || 0,
          items: Array.isArray(entry.items) ? entry.items : [],
        })),
        activeBudgetId: parsed.activeBudgetId ? String(parsed.activeBudgetId) : null,
      };
    }

    const legacyItems = Array.isArray(parsed.items) ? parsed.items : [];
    const legacyBudget = Number(parsed.budget) || 0;
    if (legacyItems.length > 0 || legacyBudget > 0) {
      const migratedBudget = {
        id: createId(),
        name: "My Budget",
        amount: legacyBudget,
        items: legacyItems,
      };
      return { budgets: [migratedBudget], activeBudgetId: migratedBudget.id };
    }

    return {
      budgets: [],
      activeBudgetId: null,
    };
  } catch (error) {
    console.warn("Could not load app state:", error);
    return { budgets: [], activeBudgetId: null };
  }
}

function saveState() {
  if (activeBudget) {
    activeBudget.name = activeBudget.name || "Untitled budget";
    activeBudget.amount = budget;
    activeBudget.items = marketItems;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ budgets, activeBudgetId }));
}

function init() {
  setupTheme();

  if (ui.setBudgetButton) {
    ui.setBudgetButton.addEventListener("click", setBudget);
  }

  if (ui.addButton) {
    ui.addButton.addEventListener("click", addItem);
  }

  if (ui.clearButton) {
    ui.clearButton.addEventListener("click", clearEverything);
  }

  if (ui.createBudgetButton) {
    ui.createBudgetButton.addEventListener("click", createBudget);
  }

  if (ui.openDashboardButton) {
    ui.openDashboardButton.addEventListener("click", showDashboard);
  }

  if (ui.homeAddItemButton) {
    ui.homeAddItemButton.addEventListener("click", () => {
      showDashboard();
      ui.itemInput?.focus();
    });
  }

  if (ui.homeViewAllButton) {
    ui.homeViewAllButton.addEventListener("click", showDashboard);
  }

  if (ui.backHomeButton) {
    ui.backHomeButton.addEventListener("click", showHome);
  }

  setupInstallPrompt();
  registerServiceWorker();

  [ui.itemInput, ui.quantityInput, ui.amountInput].forEach((input) => {
    if (!input) return;

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        addItem();
      }
    });
  });

  renderList();
}

function showDashboard() {
  if (!activeBudget) {
    showHome();
    ui.newBudgetNameInput?.focus();
    return;
  }

  ui.homeView?.classList.add("hidden");
  ui.dashboardView?.classList.remove("hidden");
  updateActiveBudgetHeading();
}

function showHome() {
  ui.dashboardView?.classList.add("hidden");
  ui.homeView?.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  if (ui.themeToggle) {
    ui.themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.dataset.theme = isDark ? "dark" : "light";

  if (ui.themeToggle) {
    ui.themeToggle.setAttribute("aria-checked", String(isDark));
    ui.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    ui.themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    ui.themeToggle.querySelector(".theme-label").textContent = isDark ? "Light" : "Dark";
  }
}

function setBudget() {
  if (!activeBudget) {
    return;
  }

  const value = Number(ui.budgetInput.value);

  if (!Number.isFinite(value) || value < 0) {
    alert("Please enter a valid budget.");
    return;
  }

  budget = value;
  saveState();
  renderList();
}

function createBudget() {
  const name = ui.newBudgetNameInput.value.trim();
  const amount = Number(ui.newBudgetAmountInput.value);

  if (!name) {
    alert("Please give this budget a name.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid budget amount.");
    return;
  }

  const newBudget = {
    id: createId(),
    name,
    amount,
    items: [],
  };

  budgets.unshift(newBudget);
  activateBudget(newBudget.id);
  ui.newBudgetNameInput.value = "";
  ui.newBudgetAmountInput.value = "";
  showDashboard();
}

function activateBudget(id) {
  const selectedBudget = budgets.find((entry) => entry.id === id);
  if (!selectedBudget) {
    return;
  }

  activeBudgetId = selectedBudget.id;
  activeBudget = selectedBudget;
  marketItems = activeBudget.items;
  budget = activeBudget.amount;
  saveState();
  renderList();
  updateActiveBudgetHeading();
  updateSavedBudgets();
}

function deleteBudget(id) {
  const selectedBudget = budgets.find((entry) => entry.id === id);
  if (!selectedBudget || !confirm(`Delete "${selectedBudget.name}"?`)) {
    return;
  }

  const index = budgets.findIndex((entry) => entry.id === id);
  budgets.splice(index, 1);

  if (activeBudgetId === id) {
    activeBudget = budgets[0] || null;
    activeBudgetId = activeBudget ? activeBudget.id : null;
    marketItems = activeBudget ? activeBudget.items : [];
    budget = activeBudget ? activeBudget.amount : 0;
    renderList();
    showHome();
  }

  saveState();
  updateSavedBudgets();
}

function renameBudget(id) {
  const selectedBudget = budgets.find((entry) => entry.id === id);
  if (!selectedBudget) {
    return;
  }

  const nextName = prompt("Rename budget", selectedBudget.name)?.trim();
  if (!nextName) {
    return;
  }

  selectedBudget.name = nextName;
  saveState();
  updateSavedBudgets();
  updateActiveBudgetHeading();
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addItem() {
  const itemName = ui.itemInput.value.trim();
  const category = ui.categoryInput.value;
  const quantity = Number(ui.quantityInput.value);
  const amount = Number(ui.amountInput.value);

  if (!itemName) {
    alert("Please enter an item.");
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid price.");
    return;
  }

  marketItems.push({ name: itemName, category, quantity, amount });
  saveState();
  renderList();
  clearInputs();
}

function renderList() {
  if (ui.marketList) {
    ui.marketList.innerHTML = "";
  }

  marketItems.forEach((item, index) => {
    const row = document.createElement("tr");
    const total = item.quantity * item.amount;

    const indexCell = document.createElement("td");
    indexCell.textContent = String(index + 1);

    const nameCell = document.createElement("td");
    const itemName = document.createElement("strong");
    itemName.textContent = item.name;
    nameCell.appendChild(itemName);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category || "Other";

    const quantityCell = document.createElement("td");
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.className = "table-input";
    quantityInput.value = String(item.quantity);
    quantityInput.min = "1";
    quantityInput.dataset.index = String(index);
    quantityInput.addEventListener("change", handleQuantityChange);
    quantityCell.appendChild(quantityInput);

    const amountCell = document.createElement("td");
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.className = "table-input";
    amountInput.value = String(item.amount);
    amountInput.min = "0";
    amountInput.dataset.index = String(index);
    amountInput.addEventListener("change", handleAmountChange);
    amountCell.appendChild(amountInput);

    const totalCell = document.createElement("td");
    const totalValue = document.createElement("strong");
    totalValue.textContent = formatMoney(total);
    totalCell.appendChild(totalValue);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteItem(index));
    actionCell.appendChild(deleteButton);

    row.append(indexCell, nameCell, categoryCell, quantityCell, amountCell, totalCell, actionCell);
    ui.marketList.appendChild(row);
  });

  updateTotal();
  updateEmptyMessage();
}

function handleQuantityChange(event) {
  const index = Number(event.target.dataset.index);
  const newQuantity = Number(event.target.value);

  if (!Number.isFinite(newQuantity) || newQuantity <= 0) {
    alert("Quantity must be greater than 0.");
    renderList();
    return;
  }

  marketItems[index].quantity = newQuantity;
  saveState();
  renderList();
}

function handleAmountChange(event) {
  const index = Number(event.target.dataset.index);
  const newAmount = Number(event.target.value);

  if (!Number.isFinite(newAmount) || newAmount < 0) {
    alert("Please enter a valid price.");
    renderList();
    return;
  }

  marketItems[index].amount = newAmount;
  saveState();
  renderList();
}

function deleteItem(index) {
  marketItems.splice(index, 1);
  saveState();
  renderList();
}

function updateTotal() {
  const totalSpent = marketItems.reduce((sum, item) => sum + item.quantity * item.amount, 0);

  if (ui.budgetDisplay) {
    ui.budgetDisplay.textContent = formatMoney(budget);
  }

  if (ui.spentDisplay) {
    ui.spentDisplay.textContent = formatMoney(totalSpent);
  }

  if (ui.remainingDisplay) {
    const remaining = budget - totalSpent;
    ui.remainingDisplay.textContent = formatMoney(remaining);
  }

  if (ui.grandTotal) {
    ui.grandTotal.textContent = formatMoney(totalSpent);
  }

  if (ui.budgetInput) {
    ui.budgetInput.value = budget > 0 ? String(budget) : "";
  }

  updateBudgetProgress(totalSpent);
  updateItemCount();
  updateCategoryBreakdown();
  updateSavedBudgets();
}

function updateSavedBudgets() {
  if (!ui.savedBudgets) {
    return;
  }

  ui.savedBudgets.innerHTML = "";
  ui.budgetCount.textContent = `${budgets.length} ${budgets.length === 1 ? "budget" : "budgets"}`;

  if (budgets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "saved-budgets-empty";
    empty.textContent = "Your saved budgets will appear here.";
    ui.savedBudgets.appendChild(empty);
    return;
  }

  budgets.forEach((entry) => {
    const card = document.createElement("article");
    card.className = `saved-budget-card${entry.id === activeBudgetId ? " active" : ""}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${entry.name}`);
    card.addEventListener("click", () => {
      activateBudget(entry.id);
      showDashboard();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });

    const cardMain = document.createElement("div");
    cardMain.className = "saved-budget-main";
    const name = document.createElement("strong");
    name.textContent = entry.name;
    const spent = entry.items.reduce((sum, item) => sum + item.quantity * item.amount, 0);
    const details = document.createElement("span");
    details.textContent = `${entry.items.length} ${entry.items.length === 1 ? "item" : "items"} · ${formatMoney(spent)} spent`;
    cardMain.append(name, details);

    const amount = document.createElement("strong");
    amount.className = "saved-budget-amount";
    amount.textContent = formatMoney(entry.amount);

    const actions = document.createElement("div");
    actions.className = "saved-budget-actions";
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "saved-budget-menu-button";
    menuButton.setAttribute("aria-label", `Actions for ${entry.name}`);
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "⋯";

    const menu = document.createElement("div");
    menu.className = "saved-budget-menu hidden";

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.textContent = "Rename";
    renameButton.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.add("hidden");
      renameBudget(entry.id);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.add("hidden");
      activateBudget(entry.id);
      showDashboard();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-action";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.add("hidden");
      deleteBudget(entry.id);
    });

    menu.append(renameButton, editButton, deleteButton);
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = !menu.classList.contains("hidden");
      document.querySelectorAll(".saved-budget-menu").forEach((item) => item.classList.add("hidden"));
      document.querySelectorAll(".saved-budget-menu-button").forEach((item) => item.setAttribute("aria-expanded", "false"));
      menu.classList.toggle("hidden", isOpen);
      menuButton.setAttribute("aria-expanded", String(!isOpen));
    });

    actions.append(menuButton, menu);

    card.append(cardMain, amount, actions);
    ui.savedBudgets.appendChild(card);
  });
}

function updateActiveBudgetHeading() {
  if (ui.activeBudgetName) {
    ui.activeBudgetName.textContent = activeBudget ? activeBudget.name : "My Budget";
  }
}

function updateCategoryBreakdown() {
  if (!ui.categoryBreakdown) {
    return;
  }

  const totals = marketItems.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + item.quantity * item.amount;
    return acc;
  }, {});

  const entries = Object.entries(totals);

  ui.categoryBreakdown.innerHTML = "";

  if (entries.length === 0) {
    ui.categoryBreakdown.innerHTML = '<div class="category-pill"><strong>No data</strong><span>₦0</span></div>';
    return;
  }

  entries.forEach(([category, total]) => {
    const pill = document.createElement("div");
    pill.className = "category-pill";

    const label = document.createElement("strong");
    label.textContent = category;

    const value = document.createElement("span");
    value.textContent = formatMoney(total);

    pill.appendChild(label);
    pill.appendChild(value);
    ui.categoryBreakdown.appendChild(pill);
  });
}

function updateBudgetProgress(totalSpent) {
  if (!ui.percentage || !ui.progressBar || !ui.budgetMessage || !ui.budgetInsight) {
    return;
  }

  if (budget <= 0) {
    ui.percentage.textContent = "0%";
    ui.progressBar.style.width = "0%";
    ui.progressBar.style.background = "linear-gradient(135deg, #b85c45 0%, #d48a6b 100%)";
    ui.budgetMessage.textContent = "Set a budget to start tracking your spending.";
    ui.budgetInsight.textContent = "Waiting for budget";
    ui.budgetInsight.className = "budget-insight neutral";
    return;
  }

  const percentage = Math.min((totalSpent / budget) * 100, 100);
  ui.percentage.textContent = `${Math.round(percentage)}%`;
  ui.progressBar.style.width = `${percentage}%`;

  if (totalSpent > budget) {
    ui.progressBar.style.background = "linear-gradient(135deg, #c95d58 0%, #e47a73 100%)";
    ui.budgetMessage.textContent = "You have exceeded your budget.";
    ui.budgetInsight.textContent = "Over budget";
    ui.budgetInsight.className = "budget-insight danger";
  } else if (percentage >= 80) {
    ui.progressBar.style.background = "linear-gradient(135deg, #c88742 0%, #e0a15a 100%)";
    ui.budgetMessage.textContent = "You are close to reaching your budget limit.";
    ui.budgetInsight.textContent = "Almost there";
    ui.budgetInsight.className = "budget-insight watch";
  } else {
    ui.progressBar.style.background = "linear-gradient(135deg, #5c956c 0%, #7ab889 100%)";
    ui.budgetMessage.textContent = "You are within your budget.";
    ui.budgetInsight.textContent = "On track";
    ui.budgetInsight.className = "budget-insight safe";
  }
}

function updateItemCount() {
  if (ui.itemCount) {
    ui.itemCount.textContent = String(marketItems.length);
  }

  if (ui.sumTotal) {
    ui.sumTotal.textContent = formatMoney(marketItems.reduce((sum, item) => sum + item.quantity * item.amount, 0));
  }
}

function formatMoney(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
}

function clearInputs() {
  if (ui.itemInput) ui.itemInput.value = "";
  if (ui.categoryInput) ui.categoryInput.value = "Food";
  if (ui.quantityInput) ui.quantityInput.value = "";
  if (ui.amountInput) ui.amountInput.value = "";
}

function clearEverything() {
  if (marketItems.length === 0 && budget === 0) {
    return;
  }

  const confirmClear = confirm("Are you sure you want to clear everything?");

  if (confirmClear) {
    marketItems.length = 0;
    budget = 0;
    saveState();
    clearInputs();
    renderList();
  }
}

function updateEmptyMessage() {
  if (ui.emptyMessage) {
    ui.emptyMessage.style.display = marketItems.length === 0 ? "block" : "none";
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

function setupInstallPrompt() {
  if (!ui.installButton) {
    return;
  }

  if (!window.matchMedia("(display-mode: standalone)").matches) {
    ui.installButton.classList.remove("hidden");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    ui.installButton.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    ui.installButton.classList.add("hidden");
  });

  ui.installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      alert("This browser may not support automatic install prompts. You can still use the app in the browser.");
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    ui.installButton.classList.add("hidden");
  });
}

window.setBudget = setBudget;
window.addItem = addItem;
window.clearEverything = clearEverything;

init();





                                                                                                                                                                                                                                                                                                                                                                                                                                         