let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

let currentDate = new Date();

const currentMonthElement = document.getElementById("currentMonth");
const totalAmountElement = document.getElementById("totalAmount");
const carTotalAmountElement = document.getElementById("carTotalAmount");
const carMyShareAmountElement = document.getElementById("carMyShareAmount");
const expenseListElement = document.getElementById("expenseList");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const isCarInput = document.getElementById("isCar");
const memoInput = document.getElementById("memo");

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

dateInput.value = getLocalDateString();

function updateMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    currentMonthElement.textContent = `${year}年${month}月`;

    renderExpenses();
}

function renderExpenses() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const monthlyExpenses = expenses.filter(expense => {
        const [expenseYear, expenseMonth] = expense.date.split("-").map(Number);
        return expenseYear === year && expenseMonth === month;
    });

    // 全体合計（車代は半額、通常出費は全額で計算）
    const total = monthlyExpenses.reduce((sum, expense) => {
        const myShare = expense.isCar ? expense.amount / 2 : expense.amount;
        return sum + myShare;
    }, 0);

    // 車代の総額および自分負担分の集計
    const carExpenses = monthlyExpenses.filter(expense => expense.isCar);
    const carTotal = carExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const carMyShare = carTotal / 2;

    totalAmountElement.textContent = `¥${total.toLocaleString()}`;
    carTotalAmountElement.textContent = `¥${carTotal.toLocaleString()}`;
    carMyShareAmountElement.textContent = `¥${carMyShare.toLocaleString()}`;

    if (monthlyExpenses.length === 0) {
        expenseListElement.innerHTML = `<div class="empty">この月の出費はありません</div>`;
        return;
    }

    const grouped = {};

    monthlyExpenses.forEach(expense => {
        if (!grouped[expense.date]) {
            grouped[expense.date] = [];
        }
        grouped[expense.date].push(expense);
    });

    const dates = Object.keys(grouped).sort().reverse();

    expenseListElement.innerHTML = "";

    dates.forEach(date => {
        const dayExpenses = grouped[date];

        // 日別合計（自分負担分で計算）
        const dayTotal = dayExpenses.reduce((sum, expense) => {
            const myShare = expense.isCar ? expense.amount / 2 : expense.amount;
            return sum + myShare;
        }, 0);

        const [yearNum, monthNum, dayNum] = date.split("-").map(Number);
        const dateObject = new Date(yearNum, monthNum - 1, dayNum);

        const weekday = ["日", "月", "火", "水", "木", "金", "土"][dateObject.getDay()];
        const formattedDate = `${monthNum}月${dayNum}日（${weekday}）`;

        const group = document.createElement("div");
        group.className = "date-group";

        const header = document.createElement("div");
        header.className = "date-header";

        const dateText = document.createElement("span");
        dateText.className = "date";
        dateText.textContent = formattedDate;

        const dayTotalText = document.createElement("span");
        dayTotalText.className = "day-total";
        dayTotalText.textContent = `¥${dayTotal.toLocaleString()}`;

        header.appendChild(dateText);
        header.appendChild(dayTotalText);
        group.appendChild(header);

        dayExpenses.forEach(expense => {
            const item = document.createElement("div");
            item.className = "expense-item";

            const info = document.createElement("div");
            info.className = "expense-info";

            const memo = document.createElement("span");
            memo.className = "expense-memo";
            
            // 車代の場合はアイコンと注記を表示
            if (expense.isCar) {
                memo.textContent = `🚗 ${expense.memo || "レンタカー代"} (総額: ¥${expense.amount.toLocaleString()})`;
            } else {
                memo.textContent = expense.memo || "メモなし";
            }

            info.appendChild(memo);

            const right = document.createElement("div");

            const amount = document.createElement("span");
            amount.className = "expense-amount";
            
            // リストの金額は「自分負担分」を表示
            const displayAmount = expense.isCar ? expense.amount / 2 : expense.amount;
            amount.textContent = `¥${displayAmount.toLocaleString()}`;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "削除";
            deleteButton.addEventListener("click", () => {
                deleteExpense(expense.id);
            });

            right.appendChild(amount);
            right.appendChild(deleteButton);

            item.appendChild(info);
            item.appendChild(right);
            group.appendChild(item);
        });

        expenseListElement.appendChild(group);
    });
}

function addExpense() {
    const date = dateInput.value;
    const amount = Number(amountInput.value);
    const isCar = isCarInput.checked;
    const memo = memoInput.value.trim();

    if (!date) {
        alert("日付を入力してください");
        return;
    }

    if (!amount || amount <= 0) {
        alert("金額を入力してください");
        amountInput.focus();
        return;
    }

    const expense = {
        id: Date.now().toString(),
        date,
        amount,
        isCar,
        memo
    };

    expenses.push(expense);
    saveExpenses();
    updateMonth();

    amountInput.value = "";
    isCarInput.checked = false;
    memoInput.value = "";
    amountInput.focus();
}

document.getElementById("addButton").addEventListener("click", addExpense);

[amountInput, memoInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            addExpense();
        }
    });
});

function deleteExpense(id) {
    if (!confirm("この出費を削除しますか？")) {
        return;
    }

    expenses = expenses.filter(expense => expense.id !== id);

    saveExpenses();
    renderExpenses();
}

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonth();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonth();
});

updateMonth();
