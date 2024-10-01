// (1) Зберігання балансу і активів користувача в localStorage
let balance = localStorage.getItem('balance') ? parseFloat(localStorage.getItem('balance')) : 5000;
let holdings = JSON.parse(localStorage.getItem('holdings')) || {
    bitcoin: 0,
    ethereum: 0,
    litecoin: 0,
    ripple: 0
};
let tradingVolume = 0; // Обсяг торгів для аірдропу

// (2) Оновлення балансу на екрані
function updateBalanceDisplay() {
    document.getElementById('balance').innerText = `Баланс: $${balance.toFixed(2)} USDT`;
    localStorage.setItem('balance', balance);
}

// (3) Оновлення активів на екрані
function updateAssetsDisplay() {
    const assetsTable = document.getElementById('assets-table').querySelector('tbody');
    assetsTable.innerHTML = ''; // Очищення таблиці перед оновленням
    for (const [crypto, amount] of Object.entries(holdings)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${crypto}</td><td>${amount.toFixed(5)}</td>`;
        assetsTable.appendChild(row);
    }

    // Додаємо рядок для балансу USDT
    const balanceRow = document.createElement('tr');
    balanceRow.innerHTML = `<td>USDT</td><td>${balance.toFixed(2)}</td>`;
    assetsTable.appendChild(balanceRow);
}

// (4) Оновлення історії транзакцій
function updateTransactionHistory(transaction) {
    const historyTable = document.getElementById('transaction-history').querySelector('tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date().toLocaleString()}</td>
        <td>${transaction.type}</td>
        <td>${transaction.crypto}</td>
        <td>${transaction.quantity.toFixed(5)}</td>
        <td>${transaction.price.toFixed(2)}</td>
    `;
    historyTable.appendChild(row);
    if (historyTable.rows.length > 20) {
        historyTable.deleteRow(0); // Тільки останні 20 транзакцій
    }
}

// (5) Оновлення прогресу для аірдропу
function updateAirdropProgress() {
    const progressBar = document.getElementById('progress');
    const progressPercentage = (tradingVolume / 100) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    if (tradingVolume >= 100) {
        document.getElementById('claim-airdrop').disabled = false;
    }
}

// (6) Отримання цін з API
async function getCryptoPrices() {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,ripple&vs_currencies=usd');
    const data = await response.json();

    document.getElementById('btc-price').innerText = `$${data.bitcoin.usd}`;
    document.getElementById('eth-price').innerText = `$${data.ethereum.usd}`;
    document.getElementById('ltc-price').innerText = `$${data.litecoin.usd}`;
    document.getElementById('xrp-price').innerText = `$${data.ripple.usd}`;

    return data;
}

// (7) Функція для відкриття та закриття модальних вікон
function setupModal(modalId, buttonId, closeClass) {
    const modal = document.getElementById(modalId);
    const button = document.getElementById(buttonId);
    const close = modal.querySelector(closeClass);

    button.onclick = () => {
        modal.style.display = 'block';
    };

    close.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// (8) Функція для торгівлі (купівля/продаж) активів
function openTradeModal(crypto, price) {
    const modal = document.getElementById('trade-modal');
    const closeModal = modal.querySelector('.close-modal');
    const confirmTrade = document.getElementById('confirm-trade');
    const tradeTitle = document.getElementById('trade-title');

    tradeTitle.innerText = `Торгівля ${crypto}`;
    modal.style.display = 'block';

    closeModal.onclick = () => modal.style.display = 'none';

    confirmTrade.onclick = () => {
        const quantity = parseFloat(document.getElementById('trade-quantity').value);
        const totalCost = price * quantity;

        if (balance >= totalCost) {
            balance -= totalCost;
            holdings[crypto] += quantity;
            updateBalanceDisplay();
            tradingVolume += totalCost;
            localStorage.setItem('holdings', JSON.stringify(holdings));
            updateAirdropProgress();
            updateTransactionHistory({ type: 'Купівля', crypto, quantity, price });
            modal.style.display = 'none';
            alert(`Ви купили ${quantity} одиниць ${crypto} за $${totalCost.toFixed(2)}`);
        } else {
            alert("Недостатньо коштів!");
        }
    };
}

// (9) Функція для продажу активів
function openSellModal(crypto, price) {
    const modal = document.getElementById('trade-modal');
    const closeModal = modal.querySelector('.close-modal');
    const confirmTrade = document.getElementById('confirm-trade');
    const tradeTitle = document.getElementById('trade-title');

    tradeTitle.innerText = `Продаж ${crypto}`;
    modal.style.display = 'block';

    closeModal.onclick = () => modal.style.display = 'none';

    confirmTrade.onclick = () => {
        const quantity = parseFloat(document.getElementById('trade-quantity').value);
        if (holdings[crypto] >= quantity) {
            const totalValue = price * quantity;
            balance += totalValue;
            holdings[crypto] -= quantity;
            updateBalanceDisplay();
            tradingVolume += totalValue;
            localStorage.setItem('holdings', JSON.stringify(holdings));
            updateAirdropProgress();
            updateTransactionHistory({ type: 'Продаж', crypto, quantity, price });
            modal.style.display = 'none';
            alert(`Ви продали ${quantity} одиниць ${crypto} за $${totalValue.toFixed(2)}`);
        } else {
            alert("Недостатньо активів для продажу!");
        }
    };
}

// (10) Підключення подій для кнопок купівлі/продажу
async function setupButtons(prices) {
    document.getElementById('buy-btc').onclick = () => openTradeModal('bitcoin', prices.bitcoin.usd);
    document.getElementById('sell-btc').onclick = () => openSellModal('bitcoin', prices.bitcoin.usd);

    document.getElementById('buy-eth').onclick = () => openTradeModal('ethereum', prices.ethereum.usd);
    document.getElementById('sell-eth').onclick = () => openSellModal('ethereum', prices.ethereum.usd);

    document.getElementById('buy-ltc').onclick = () => openTradeModal('litecoin', prices.litecoin.usd);
    document.getElementById('sell-ltc').onclick = () => openSellModal('litecoin', prices.litecoin.usd);

    document.getElementById('buy-xrp').onclick = () => openTradeModal('ripple', prices.ripple.usd);
    document.getElementById('sell-xrp').onclick = () => openSellModal('ripple', prices.ripple.usd);
}

// (11) Ініціалізація гри
window.onload = async function () {
    const prices = await getCryptoPrices();
    setupButtons(prices); // Налаштування кнопок для купівлі та продажу
    updateBalanceDisplay(); // Оновлення відображення балансу
    updateAssetsDisplay();  // Оновлення відображення активів
    updateAirdropProgress(); // Оновлення прогресу аірдропу
    setupModal('market-container', 'market-btn', '.close-modal'); // Модальне вікно для ринків
    setupModal('assets-modal', 'view-assets', '.close-modal'); // Модальне вікно для активів
    setupModal('transaction-history-modal', 'view-transaction-history', '.close-modal'); // Модальне вікно для історії транзакцій
    setupModal('leaderboard-modal', 'view-leaderboard', '.close-modal'); // Модальне вікно для лідерборду
};
