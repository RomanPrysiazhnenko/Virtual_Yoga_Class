// (1) Функція для отримання даних з Binance API
async function getBinancePriceHistory(symbol) {
    // (2) Запит до Binance API для отримання історичних даних по символу (наприклад BTCUSDT)
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=60`);
    const data = await response.json();
    
    // (3) Повертаємо масив з часом і ціною закриття
    return data.map(candle => {
        return {
            time: candle[0], // Час відкриття свічки
            close: parseFloat(candle[4]) // Ціна закриття свічки
        };
    });
}

// (4) Функція для побудови графіка
function createPriceChart(prices) {
    const ctx = document.getElementById('crypto-chart').getContext('2d');
    const labels = prices.map(price => new Date(price.time).toLocaleTimeString()); // (5) Створюємо мітки часу
    const data = prices.map(price => price.close); // (6) Витягуємо ціни закриття

    // (7) Створюємо графік
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ціна (USD)',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute' // (8) Налаштовуємо мітки часу як хвилини
                    }
                }
            }
        }
    });

    return chart; // (9) Повертаємо графік для подальшого оновлення
}

let chart; // (10) Глобальна змінна для зберігання графіка

// (11) Функція для оновлення графіка
async function updateChart(symbol) {
    const prices = await getBinancePriceHistory(symbol); // (12) Отримуємо нові дані з Binance API

    if (!chart) {
        // (13) Якщо графік ще не створено, створюємо його
        chart = createPriceChart(prices);
    } else {
        // (14) Якщо графік вже існує, оновлюємо дані
        chart.data.labels = prices.map(price => new Date(price.time).toLocaleTimeString());
        chart.data.datasets[0].data = prices.map(price => price.close);
        chart.update(); // (15) Оновлюємо графік
    }
}

// (16) Оновлюємо графік кожні 30 секунд
setInterval(() => {
    updateChart('BTCUSDT'); // (17) Оновлюємо графік для BTCUSDT
}, 30000);

// (18) Створюємо графік при завантаженні сторінки
window.onload = () => {
    updateChart('BTCUSDT'); // (19) Перший запит для створення графіка
};
