                                                                 // ==========================================
// NAIJABUDGIFY V2
// ==========================================


// Store all market items
let marketItems = [];


// Store the user's budget
let budget = 0;



// ==========================================
// SET BUDGET
// ==========================================

function setBudget() {

    // Get the budget input
    let budgetInput =
        Number(document.getElementById("budget").value);


    // Check if budget is valid
    if (budgetInput <= 0 || isNaN(budgetInput)) {

        alert("Please enter a valid budget.");

        return;
    }


    // Save the budget
    budget = budgetInput;


    // Update everything
    updateDisplay();


    // Clear the input
    document.getElementById("budget").value = "";

}



// ==========================================
// ADD ITEM
// ==========================================

function addItem() {

    // Get item name
    let itemName =
        document.getElementById("item").value.trim();


    // Get quantity
    let quantity =
        Number(document.getElementById("quantity").value);


    // Get price
    let amount =
        Number(document.getElementById("amount").value);


    // Validate item name
    if (itemName === "") {

        alert("Please enter an item.");

        return;
    }


    // Validate quantity
    if (quantity <= 0 || isNaN(quantity)) {

        alert("Please enter a valid quantity.");

        return;
    }


    // Validate price
    if (amount < 0 || isNaN(amount)) {

        alert("Please enter a valid price.");

        return;
    }


    // Create item object
    let newItem = {

        name: itemName,

        quantity: quantity,

        amount: amount

    };


    // Add item to array
    marketItems.push(newItem);


    // Update application
    updateDisplay();


    // Clear input fields
    clearInputs();

}



// ==========================================
// DISPLAY ITEMS
// ==========================================

function displayItems() {

    let marketList =
        document.getElementById("marketList");


    // Empty the table
    marketList.innerHTML = "";


    // Loop through items
    marketItems.forEach(function(item, index) {


        // Calculate item total
        let total =
            item.quantity * item.amount;


        // Create row
        let row =
            document.createElement("tr");


        // Add content
        row.innerHTML = `

            <td>
                ${index + 1}
            </td>


            <td>
                <strong>
                    ${item.name}
                </strong>
            </td>


            <td>

                <input
                    type="number"
                    class="table-input"
                    value="${item.quantity}"
                    min="1"
                    onchange="
                        updateQuantity(
                            ${index},
                            this.value
                        )
                    "
                >

            </td>


            <td>

                <input
                    type="number"
                    class="table-input"
                    value="${item.amount}"
                    min="0"
                    onchange="
                        updateAmount(
                            ${index},
                            this.value
                        )
                    "
                >

            </td>


            <td>

                <strong>
                    ${formatMoney(total)}
                </strong>

            </td>


            <td>

                <button
                    class="delete-btn"
                    onclick="
                        deleteItem(${index})
                    "
                >
                    Delete
                </button>

            </td>

        `;


        // Add row to table
        marketList.appendChild(row);

    });


    // Update empty message
    updateEmptyMessage();

}



// ==========================================
// UPDATE QUANTITY
// ==========================================

function updateQuantity(index, value) {

    let quantity = Number(value);


    if (quantity <= 0 || isNaN(quantity)) {

        alert("Quantity must be greater than 0.");

        displayItems();

        return;
    }


    marketItems[index].quantity =
        quantity;


    updateDisplay();

}



// ==========================================
// UPDATE PRICE
// ==========================================

function updateAmount(index, value) {

    let amount = Number(value);


    if (amount < 0 || isNaN(amount)) {

        alert("Please enter a valid price.");

        displayItems();

        return;
    }


    marketItems[index].amount =
        amount;


    updateDisplay();

}



// ==========================================
// DELETE ITEM
// ==========================================

function deleteItem(index) {

    marketItems.splice(index, 1);


    updateDisplay();

}



// ==========================================
// CALCULATE TOTAL SPENDING
// ==========================================

function calculateTotal() {

    let total = 0;


    marketItems.forEach(function(item) {

        let itemTotal =
            item.quantity * item.amount;


        total += itemTotal;

    });


    return total;

}



// ==========================================
// UPDATE EVERYTHING
// ==========================================

function updateDisplay() {

    // Update table
    displayItems();


    // Get total spending
    let totalSpent =
        calculateTotal();


    // Calculate remaining money
    let remaining =
        budget - totalSpent;


    // Update budget
    document.getElementById("budgetDisplay")
        .textContent =
        formatMoney(budget);


    // Update spent
    document.getElementById("spentDisplay")
        .textContent =
        formatMoney(totalSpent);


    // Update remaining
    document.getElementById("remainingDisplay")
        .textContent =
        formatMoney(remaining);


    // Update grand total
    document.getElementById("grandTotal")
        .textContent =
        formatMoney(totalSpent);


    // Update progress
    updateProgress(
        totalSpent
    );

}



// ==========================================
// UPDATE PROGRESS BAR
// ==========================================

function updateProgress(totalSpent) {

    let progressBar =
        document.getElementById("progressBar");


    let percentageText =
        document.getElementById("percentage");


    let message =
        document.getElementById("budgetMessage");


    // If no budget has been set
    if (budget <= 0) {

        progressBar.style.width = "0%";

        percentageText.textContent = "0%";

        message.textContent =
            "Set a budget to start tracking your spending.";

        return;

    }


    // Calculate percentage
    let percentage =
        (totalSpent / budget) * 100;


    // Limit visual bar to 100%
    let barWidth =
        Math.min(percentage, 100);


    // Update bar
    progressBar.style.width =
        barWidth + "%";


    // Display percentage
    percentageText.textContent =
        Math.round(percentage) + "%";


    // Check budget status
    if (totalSpent > budget) {

        let amountOver =
            totalSpent - budget;


        message.textContent =
            "⚠️ You are over budget by "
            + formatMoney(amountOver);


        progressBar.style.background =
            "#dc3545";

    }


    else if (percentage >= 80) {

        message.textContent =
            "⚠️ You are getting close to your budget limit.";


        progressBar.style.background =
            "#ffc107";

    }


    else {

        let remaining =
            budget - totalSpent;


        message.textContent =
            "You still have "
            + formatMoney(remaining)
            + " available.";


        progressBar.style.background =
            "#198754";

    }

}



// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount) {

    return "₦" +
        amount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}



// ==========================================
// CLEAR INPUTS
// ==========================================

function clearInputs() {

    document.getElementById("item").value = "";

    document.getElementById("quantity").value = "";

    document.getElementById("amount").value = "";

}



// ==========================================
// CLEAR EVERYTHING
// ==========================================

function clearEverything() {

    if (
        marketItems.length === 0 &&
        budget === 0
    ) {

        return;

    }


    let confirmation =
        confirm(
            "Are you sure you want to clear your entire budget and market list?"
        );


    if (confirmation) {

        // Empty market items
        marketItems = [];


        // Reset budget
        budget = 0;


        // Clear budget input
        document.getElementById("budget").value = "";


        // Update application
        updateDisplay();

    }

}



// ==========================================
// EMPTY MESSAGE
// ==========================================

function updateEmptyMessage() {

    let emptyMessage =
        document.getElementById("emptyMessage");


    if (marketItems.length === 0) {

        emptyMessage.style.display =
            "block";

    }

    else {

        emptyMessage.style.display =
            "none";

    }

}



// ==========================================
// START APPLICATION
// ==========================================

updateDisplay();                                                                                                                                                                                                                                                                                                                                                                        
