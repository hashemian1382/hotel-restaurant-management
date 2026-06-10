const store = {
    init() {
        if (!localStorage.getItem('restaurant_menu')) {
            const initialMenu = [
                { id: 1, name: 'چلو کباب کوبیده', category: 'چلو کباب و ایرانی', price: 150000, available: true },
                { id: 2, name: 'پیتزا پپرونی', category: 'فست‌فود', price: 180000, available: true },
                { id: 3, name: 'سالاد سزار', category: 'پیش‌غذا و سالاد', price: 120000, available: true },
                { id: 4, name: 'نوشابه قوطی', category: 'نوشیدنی‌ها', price: 25000, available: true }
            ];
            localStorage.setItem('restaurant_menu', JSON.stringify(initialMenu));
        }

        if (!localStorage.getItem('restaurant_tables')) {
            const tables = [];
            for (let i = 1; i <= 80; i++) {
                tables.push({ id: i, status: 'free' });
            }
            localStorage.setItem('restaurant_tables', JSON.stringify(tables));
        }

        if (!localStorage.getItem('restaurant_orders')) {
            localStorage.setItem('restaurant_orders', JSON.stringify([]));
        }

        if (!localStorage.getItem('restaurant_sales')) {
            localStorage.setItem('restaurant_sales', '0');
        }
    },

    getData(key) {
        return JSON.parse(localStorage.getItem(`restaurant_${key}`)) || [];
    },

    setData(key, data) {
        localStorage.setItem(`restaurant_${key}`, JSON.stringify(data));
    },

    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }
};

store.init();
