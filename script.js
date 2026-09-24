const marketItems = [];

const ui = {
  itemInput: document.getElementById("item"),
  quantityInput: document.getElementById("quantity"),
  amountInput: document.getElementById("amount"),
  marketList: document.getElementById("marketList"),
  itemCount: document.getElementById("itemCount"),
  sumTotal: document.getElementById("sumTotal"),
  grandTotal: document.getElementById("grandTotal"),
  emptyMessage: document.getElementById("emptyMessage"),
  addButton: document.getElementById("addItemBtn"),
  clearButton: document.getElementById("clearListBtn"),
};

function init() {
  ui.addButton.addEventListener("click", addItem);
  ui.clearButton.addEventListener("click", clearList);

  [ui.itemInput, ui.quantityInput, ui.amountInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        addItem();
      }
    });
  });

  renderList();
}

function addItem() {
  const itemName = ui.itemInput.value.trim();
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

  marketItems.push({ name: itemName, quantity, amount });
  renderList();
  clearInputs();
}

function renderList() {
  ui.marketList.innerHTML = "";

  marketItems.forEach((item, index) => {
    const row = document.createElement("tr");
    const total = item.quantity * item.amount;

    const indexCell = document.createElement("td");
    indexCell.textContent = String(index + 1);

    const nameCell = document.createElement("td");
    const itemName = document.createElement("strong");
    itemName.textContent = item.name;
    nameCell.appendChild(itemName);

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

    row.append(indexCell, nameCell, quantityCell, amountCell, totalCell, actionCell);
    ui.marketList.appendChild(row);
  });

  updateTotal();
  updateItemCount();
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
  renderList();
}

function deleteItem(index) {
  marketItems.splice(index, 1);
  renderList();
}

function updateTotal() {
  const grandTotal = marketItems.reduce((sum, item) => sum + item.quantity * item.amount, 0);
  ui.sumTotal.textContent = formatMoney(grandTotal);
  ui.grandTotal.textContent = formatMoney(grandTotal);
}

function updateItemCount() {
  ui.itemCount.textContent = String(marketItems.length);
}

function formatMoney(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function clearInputs() {
  ui.itemInput.value = "";
  ui.quantityInput.value = "";
  ui.amountInput.value = "";
}

function clearList() {
  if (marketItems.length === 0) {
    return;
  }

  const confirmClear = confirm("Are you sure you want to clear the entire list?");

  if (confirmClear) {
    marketItems.length = 0;
    renderList();
  }
}

function updateEmptyMessage() {
  ui.emptyMessage.style.display = marketItems.length === 0 ? "block" : "none";
}

init();





                                                                                                                                                                                                                                                                                                                                                                                                                                         