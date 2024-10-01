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

// (12) Ініціалізація історії транзакцій
let transactionHistory = JSON.parse(localStorage.getItem('transactionHistory')) || [];

// (13) Оновлення історії транзакцій та збереження в localStorage
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

    // Додаємо транзакцію до масиву історії
    transactionHistory.push(transaction);

    // Зберігаємо масив в localStorage
    localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));

    if (historyTable.rows.length > 20) {
        historyTable.deleteRow(0); // Тільки останні 20 транзакцій
    }
}

// (14) Функція для відображення історії транзакцій з localStorage при завантаженні сторінки
function loadTransactionHistory() {
    const historyTable = document.getElementById('transaction-history').querySelector('tbody');
    transactionHistory.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleString()}</td>
            <td>${transaction.type}</td>
            <td>${transaction.crypto}</td>
            <td>${transaction.quantity.toFixed(5)}</td>
            <td>${transaction.price.toFixed(2)}</td>
        `;
        historyTable.appendChild(row);
    });
}

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
    
    // Завантаження історії транзакцій
    loadTransactionHistory();
};
// (15) Функція для скидання гри до початкового стану
function resetGame() {
    if (confirm("Ви впевнені, що хочете почати спочатку? Всі дані будуть втрачені.")) {
        // Скидання балансу
        balance = 5000;
        localStorage.setItem('balance', balance);

        // Скидання активів
        holdings = {
            bitcoin: 0,
            ethereum: 0,
            litecoin: 0,
            ripple: 0
        };
        localStorage.setItem('holdings', JSON.stringify(holdings));

        // Скидання історії транзакцій
        transactionHistory = [];
        localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));

        // Оновлення відображення після скидання
        updateBalanceDisplay();
        updateAssetsDisplay();
        updateAirdropProgress();
        
        // Очищення таблиці історії транзакцій
        const historyTable = document.getElementById('transaction-history').querySelector('tbody');
        historyTable.innerHTML = '';

        alert("Гра почалася спочатку!");
    }
}

// (16) Додаємо подію для кнопки "Почати спочатку"
function resetGame() {
    if (confirm("Ви впевнені, що хочете почати спочатку? Всі дані будуть втрачені.")) {
        // Скидання балансу
        balance = 5000;
        localStorage.setItem('balance', balance);

        // Скидання активів
        holdings = {
            bitcoin: 0,
            ethereum: 0,
            litecoin: 0,
            ripple: 0
        };
        localStorage.setItem('holdings', JSON.stringify(holdings));

        // Скидання історії транзакцій
        transactionHistory = [];
        localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));

        // Скидання стану аірдропу
        localStorage.removeItem('airdropClaimed'); // Видаляємо статус отриманого аірдропу
        isAirdropActive = false; // Деактивуємо активність аірдропу

        // Оновлення відображення після скидання
        updateBalanceDisplay();
        updateAssetsDisplay();
        updateAirdropProgress();

        // Очищення таблиці історії транзакцій
        const historyTable = document.getElementById('transaction-history').querySelector('tbody');
        historyTable.innerHTML = '';

        // Відновлення стану кнопок аірдропу
        const claimButton = document.getElementById('claim-airdrop');
        const joinButton = document.getElementById('join-airdrop');
        joinButton.disabled = false;
        joinButton.classList.remove('active');
        joinButton.style.backgroundColor = ''; // Повертаємо оригінальний стиль кнопки
        joinButton.innerText = 'Участь в аірдропі';

        claimButton.disabled = true;
        claimButton.innerText = 'Отримати аірдроп';

        alert("Гра почалася спочатку!");
    }
}

// Виклик функції resetGame при натисканні на кнопку "Почати спочатку"
document.getElementById('reset-game').onclick = resetGame;

// (25) Функція для отримання аірдропу
function claimAirdrop() {
    const claimButton = document.getElementById('claim-airdrop');

    if (!claimButton.disabled && tradingVolume >= 100) {
        // Додаємо 10 USDT до балансу за аірдроп
        balance += 10;
        updateBalanceDisplay();
        alert("Ви отримали 10 USDT за участь в аірдропі!");

        // Встановлюємо, що аірдроп отримано, і зберігаємо цей стан
        localStorage.setItem('airdropClaimed', true);

        // Деактивуємо кнопки участі та отримання аірдропу
        document.getElementById('join-airdrop').disabled = true;
        claimButton.disabled = true;

        // Змінюємо текст кнопки на "Отримано"
        claimButton.innerText = "Отримано";
    }
}

// (26) Додаємо подію для кнопки "Отримати аірдроп"
document.getElementById('claim-airdrop').onclick = claimAirdrop;


// (27) Перевірка, чи користувач вже отримав аірдроп
function checkAirdropStatus() {
    if (localStorage.getItem('airdropClaimed')) {
        // Деактивуємо кнопки участі в аірдропі і отримання аірдропу
        document.getElementById('join-airdrop').disabled = true;
        const claimButton = document.getElementById('claim-airdrop');
        claimButton.disabled = true;
        claimButton.innerText = "Отримано";
    }
}


// (28) Функція для участі в аірдропі
function joinAirdrop() {
    const joinButton = document.getElementById('join-airdrop');

    // Перевіряємо, чи користувач уже приєднався або отримав аірдроп
    if (!joinButton.classList.contains('active') && !localStorage.getItem('airdropClaimed')) {
        // Додаємо клас активної участі
        joinButton.classList.add('active');
       
        // Змінюємо колір кнопки на зелений
        joinButton.style.backgroundColor = '#28a745'; // Зелений колір
        joinButton.innerText = 'Ви приєдналися до аірдропу!';

        // Активуємо аірдроп
        isAirdropActive = true;

        alert("Ви підтвердили участь в аірдропі!");
    }
}

document.getElementById('join-airdrop').onclick = joinAirdrop;


// Завантаження стану при завантаженні сторінки
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

    // Додаємо подію для кнопки "Отримати аірдроп"
    document.getElementById('claim-airdrop').onclick = claimAirdrop;

    // Завантаження історії транзакцій
    loadTransactionHistory();

    // Перевіряємо стан аірдропу при завантаженні сторінки
    checkAirdropStatus();
};

// (29) Отримуємо всі посилання на криптовалюти у таблиці ринків
const cryptoLinks = document.querySelectorAll('#crypto-table a');

// (30) Додаємо подію для кожного посилання
cryptoLinks.forEach(link => {
    link.addEventListener('click', async (event) => {
        event.preventDefault(); // Запобігаємо переходу за посиланням
        const symbol = event.target.id.replace('-link', '').toUpperCase() + 'USDT'; // Отримуємо символ валюти

        // (31) Оновлюємо графік для вибраної валюти
        await updateChart(symbol);

        // (32) Показуємо модальне вікно з графіком
        document.getElementById('chart-modal').style.display = 'block';
    });
});

// (33) Функція для закриття модального вікна з графіком
document.querySelector('#chart-modal .close-modal').onclick = () => {
    document.getElementById('chart-modal').style.display = 'none';
};

// (34) Отримуємо список гравців з localStorage або створюємо порожній список
let players = JSON.parse(localStorage.getItem('players')) || [];

// (35) Перевіряємо, чи гравець вже зареєстрований
let currentPlayer = localStorage.getItem('currentPlayer');

// (36) Додаємо нового гравця з балансом
function addPlayer(playerName, balance) {
    // Додаємо нового гравця до списку
    players.push({ name: playerName, balance: balance });
    
    // (37) Оновлюємо список гравців у localStorage
    localStorage.setItem('players', JSON.stringify(players));
    
    // (38) Зберігаємо ім'я поточного гравця в localStorage для наступних сесій
    localStorage.setItem('currentPlayer', playerName);
    
    // (39) Оновлюємо лідерборд
    updateLeaderboard();
}

// (40) Функція для оновлення лідерборду
function updateLeaderboard() {
    const leaderboardTable = document.getElementById('leaderboard').querySelector('tbody');
    
    // (41) Очищаємо поточний список лідерборду
    leaderboardTable.innerHTML = '';

    // (42) Додаємо кожного гравця до таблиці лідерборду
    players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${player.name}</td><td>${player.balance} USDT</td>`;
        leaderboardTable.appendChild(row);
    });
}

// (43) Оновлюємо лідерборд при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    updateLeaderboard(); // Оновлюємо лідерборд при завантаженні сторінки
    
    // (44) Якщо гравець вже зареєстрований, не показуємо модальне вікно реєстрації
    if (currentPlayer) {
        alert('Ласкаво просимо назад, ' + currentPlayer + '!');
        return; // Гравець вже зареєстрований, пропускаємо реєстрацію
    } else {
        // (45) Якщо гравець не зареєстрований, показуємо модальне вікно реєстрації
        document.getElementById('registration-modal').style.display = 'block';
    }
});

// (46) Обробляємо введення імені гравця та додаємо його до лідерборду
document.getElementById('register-player').addEventListener('click', function() {
    const playerName = document.getElementById('player-name').value; // (47) Отримуємо ім'я гравця з input

    if (playerName) {
        addPlayer(playerName, 5000); // (48) Додаємо гравця з початковим балансом 5000 USDT
        document.getElementById('registration-modal').style.display = 'none'; // (49) Закриваємо модальне вікно реєстрації
        alert('Гравець успішно доданий!'); // (50) Підтвердження, що гравець доданий
    } else {
        alert('Будь ласка, введіть ім\'я!'); // (51) Попередження, якщо ім'я не введено
    }
});
