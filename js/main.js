// Баланс і активи користувача збережені в localStorage
let balance = localStorage.getItem('balance') ? parseFloat(localStorage.getItem('balance')) : 1000;
let holdings = JSON.parse(localStorage.getItem('holdings')) || {
    bitcoin: 0,
    ethereum: 0,
    litecoin: 0,
    ripple: 0
};
let tradingVolume = 0; // Обсяг торгів для аірдропу

// Оновлення балансу на екрані
function updateBalanceDisplay() {
    document.getElementById('balance').innerText = `Баланс: $${balance.toFixed(2)}`;
    localStorage.setItem('balance', balance);
}

// Оновлення активів на екрані
function updateAssetsDisplay() {
    const assetsTable = document.getElementById('assets-table').querySelector('tbody');
    assetsTable.innerHTML = ''; // Очищення таблиці перед оновленням
    for (const [crypto, amount] of Object.entries(holdings)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${crypto}</td><td>${amount.toFixed(2)}</td>`;
        assetsTable.appendChild(row);
    }
}

// Відкриття і закриття модальних вікон
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

// Оновлення прогресу для аірдропу
function updateAirdropProgress() {
    const progressBar = document.getElementById('progress');
    const progressPercentage = (tradingVolume / 100) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    if (tradingVolume >= 100) {
        document.getElementById('claim-airdrop').disabled = false;
    }
}

// Отримання цін з API
async function getCryptoPrices() {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,ripple&vs_currencies=usd');
    const data = await response.json();

    document.getElementById('btc-price').innerText = `$${data.bitcoin.usd}`;
    document.getElementById('eth-price').innerText = `$${data.ethereum.usd}`;
    document.getElementById('ltc-price').innerText = `$${data.litecoin.usd}`;
    document.getElementById('xrp-price').innerText = `$${data.ripple.usd}`;

    return data;
}

// Функція для торгівлі (купівля/продаж) активів
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
        const amount = parseFloat(document.getElementById('trade-amount').value);
        const totalCost = price * quantity;

        if (balance >= totalCost) {
            balance -= totalCost;
            holdings[crypto] += quantity;
            updateBalanceDisplay();
            tradingVolume += totalCost; // Збільшуємо обсяг торгів
            localStorage.setItem('holdings', JSON.stringify(holdings));
            updateAirdropProgress();
            modal.style.display = 'none';
            alert(`Ви купили ${quantity} одиниць ${crypto} за $${totalCost.toFixed(2)}`);
        } else {
            alert("Недостатньо коштів!");
        }
    };
}

// Функція для "Купити все" та "Продати все"
function setupTradeAllButtons(crypto, price) {
    document.getElementById('buy-all').onclick = () => {
        const totalAmount = balance / price;
        holdings[crypto] += totalAmount;
        balance = 0; // Витрачаємо весь баланс
        tradingVolume += totalAmount * price;
        updateBalanceDisplay();
        updateAirdropProgress();
        localStorage.setItem('holdings', JSON.stringify(holdings));
        alert(`Ви купили все ${crypto}!`);
    };

    document.getElementById('sell-all').onclick = () => {
        const totalSale = holdings[crypto] * price;
        balance += totalSale;
        tradingVolume += totalSale; // Додаємо до обсягу торгів
        holdings[crypto] = 0; // Продаємо всі активи
        updateBalanceDisplay();
        updateAirdropProgress();
        localStorage.setItem('holdings', JSON.stringify(holdings));
        alert(`Ви продали все ${crypto}!`);
    };
}

// Підключення подій для кнопок купівлі/продажу
async function setupButtons(prices) {
    document.getElementById('buy-btc').onclick = () => openTradeModal('bitcoin', prices.bitcoin.usd);
    document.getElementById('sell-btc').onclick = () => openTradeModal('bitcoin', prices.bitcoin.usd);

    document.getElementById('buy-eth').onclick = () => openTradeModal('ethereum', prices.ethereum.usd);
    document.getElementById('sell-eth').onclick = () => openTradeModal('ethereum', prices.ethereum.usd);

    document.getElementById('buy-ltc').onclick = () => openTradeModal('litecoin', prices.litecoin.usd);
    document.getElementById('sell-ltc').onclick = () => openTradeModal('litecoin', prices.litecoin.usd);

    document.getElementById('buy-xrp').onclick = () => openTradeModal('ripple', prices.ripple.usd);
    document.getElementById('sell-xrp').onclick = () => openTradeModal('ripple', prices.ripple.usd);
}

// Функція для відкриття графіків криптовалют
function renderChart(crypto, prices) {
    const ctx = document.getElementById('crypto-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1 год', '6 год', '12 год', '24 год'], // Мітки часу
            datasets: [{
                label: `${crypto} Ціна`,
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Відкриття модального вікна для графіків
function openChartModal(crypto, prices) {
    const modal = document.getElementById('chart-modal');
    modal.style.display = 'block';
    renderChart(crypto, prices);
}

// Підключення модальних вікон
setupModal('market-container', 'market-btn', '.close-modal');
setupModal('assets-modal', 'view-assets', '.close-modal');
setupModal('transaction-history-modal', 'view-transaction-history', '.close-modal');
setupModal('leaderboard-modal', 'view-leaderboard', '.close-modal');
setupModal('chart-modal', 'btc-link', '.close-modal');
setupModal('chart-modal', 'eth-link', '.close-modal');

// Для Ripple і Litecoin також додамо обробники для модальних вікон графіків
document.getElementById('ltc-link').onclick = () => openChartModal('Litecoin', [100, 105, 110, 115]);
document.getElementById('xrp-link').onclick = () => openChartModal('Ripple', [0.50, 0.52, 0.53, 0.54]);

// Ініціалізація гри
window.onload = async function () {
    const prices = await getCryptoPrices();
    setupButtons(prices);
    updateBalanceDisplay();
    updateAirdropProgress();
};
