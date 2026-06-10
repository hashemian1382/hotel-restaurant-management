const waiter = {
    currentOrderItems: [],
    currentTableId: null,
    searchQuery: '',
    currentCategory: 'all',

    init() {
        this.renderTables();
        this.renderReadyOrders();
    },

    renderTables() {
        const tables = store.getData('tables');
        const grid = document.getElementById('waiter-tables-grid');
        grid.innerHTML = '';

        tables.forEach(table => {
            const btn = document.createElement('button');
            let bgClass = 'bg-green-100 border-green-500 text-green-700';
            let iconColor = 'text-green-600';
            
            if (table.status === 'occupied') {
                bgClass = 'bg-red-100 border-red-500 text-red-700';
                iconColor = 'text-red-600';
            }
            if (table.status === 'waiting') {
                bgClass = 'bg-yellow-100 border-yellow-500 text-yellow-700';
                iconColor = 'text-yellow-600';
            }

            btn.className = `border-2 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-105 transition-all ${bgClass}`;
            btn.innerHTML = `
                <i data-lucide="armchair" class="w-8 h-8 ${iconColor}"></i>
                <span class="text-lg">میز ${table.id}</span>
            `;
            btn.onclick = () => this.handleTableClick(table);
            grid.appendChild(btn);
        });
        lucide.createIcons();
    },

    renderReadyOrders() {
        const orders = store.getData('orders').filter(o => o.status === 'ready');
        const list = document.getElementById('waiter-ready-list');
        list.innerHTML = '';

        if (orders.length === 0) {
            list.innerHTML = '<div class="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-lg border border-dashed">سفارشی آماده نیست.</div>';
            return;
        }

        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <i data-lucide="bell-ring" class="w-5 h-5"></i>
                    </div>
                    <div><span class="font-bold text-lg text-indigo-700">میز ${order.tableId}</span> آماده تحویل است.</div>
                </div>
                <button onclick="waiter.markDelivered(${order.id})" class="bg-green-500 hover:bg-green-600 transition-colors text-white px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-bold">
                    <i data-lucide="check-circle" class="w-5 h-5"></i> تحویل شد
                </button>
            `;
            list.appendChild(div);
        });
        lucide.createIcons();
    },

    handleTableClick(table) {
        if (table.status === 'free') {
            this.currentTableId = table.id;
            this.currentOrderItems = [];
            this.openOrderModal();
        } else {
            const orders = store.getData('orders');
            const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'paid');
            if (activeOrder) {
                this.currentTableId = table.id;
                this.currentOrderItems = JSON.parse(JSON.stringify(activeOrder.items));
                this.openOrderModal(activeOrder.id);
            }
        }
    },

    openOrderModal(orderId = null) {
        this.searchQuery = '';
        this.currentCategory = 'all';

        const contentHTML = `
            <div class="flex flex-col md:flex-row gap-6 w-[95vw] lg:w-[1200px] min-h-[80vh]">
                <div class="w-full md:w-3/4 flex flex-col border-l pl-6">
                    <div class="relative mb-4">
                        <input type="text" placeholder="جستجوی غذا..." oninput="waiter.handleSearch(event)" class="w-full p-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors">
                        <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute right-3 top-3.5"></i>
                    </div>
                    <div id="waiter-category-tabs" class="flex flex-wrap gap-2 mb-4 pb-2"></div>
                    <div id="waiter-menu-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto max-h-[65vh] ml-2 pb-4 custom-scrollbar"></div>
                </div>
                <div class="w-full md:w-1/4 flex flex-col bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 class="font-bold text-lg mb-4 pb-3 border-b-2 border-gray-200 flex items-center gap-2 text-indigo-800">
                        <i data-lucide="shopping-cart" class="w-5 h-5"></i> سبد سفارش
                    </h4>
                    <div id="waiter-order-items" class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 max-h-[60vh]"></div>
                </div>
            </div>
        `;

        const footer = `
            <button onclick="app.closeModal()" class="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">بستن</button>
            <button onclick="waiter.saveOrder(${orderId})" class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-md flex items-center gap-2">
                <i data-lucide="save" class="w-5 h-5"></i> ثبت نهایی سفارش
            </button>
        `;

        app.openModal(`ثبت سفارش برای میز ${this.currentTableId}`, contentHTML, footer);
        
        this.renderMenuTabs();
        this.renderMenuGrid();
        this.renderOrderItems();
        
        setTimeout(() => lucide.createIcons(), 10);
    },

    handleSearch(event) {
        this.searchQuery = event.target.value.toLowerCase();
        this.renderMenuGrid();
    },

    setCategory(category) {
        this.currentCategory = category;
        this.renderMenuTabs();
        this.renderMenuGrid();
    },

    renderMenuTabs() {
        const tabsContainer = document.getElementById('waiter-category-tabs');
        if (!tabsContainer) return;

        const menu = store.getData('menu').filter(m => m.available);
        const categories = ['all', ...new Set(menu.map(m => m.category || 'سایر'))];
        
        const categoryNames = {
            'all': 'همه موارد'
        };

        tabsContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            const isActive = this.currentCategory === cat;
            const bgClass = isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200';
            
            btn.className = `whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${bgClass}`;
            btn.innerText = categoryNames[cat] || cat;
            btn.onclick = () => this.setCategory(cat);
            tabsContainer.appendChild(btn);
        });
    },

    renderMenuGrid() {
        const grid = document.getElementById('waiter-menu-grid');
        if (!grid) return;

        const menu = store.getData('menu').filter(m => m.available);
        grid.innerHTML = '';

        const filteredMenu = menu.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(this.searchQuery);
            const matchCategory = this.currentCategory === 'all' || (item.category || 'سایر') === this.currentCategory;
            return matchSearch && matchCategory;
        });

        if (filteredMenu.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-500 mt-10">موردی یافت نشد.</div>';
            return;
        }

        filteredMenu.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'p-3 border border-gray-200 bg-white rounded-xl hover:border-indigo-400 hover:shadow-md text-right flex flex-col justify-between h-24 transition-all group';
            btn.onclick = () => this.addItemToOrder(item.id);
            btn.innerHTML = `
                <div class="font-bold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2">${item.name}</div>
                <div class="text-indigo-600 font-bold text-sm mt-2 flex justify-between items-center w-full">
                    <span>${parseInt(item.price).toLocaleString()} ت</span>
                    <i data-lucide="plus-circle" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
            `;
            grid.appendChild(btn);
        });
        
        lucide.createIcons();
    },

    addItemToOrder(menuId) {
        const item = this.currentOrderItems.find(i => i.menuId === menuId);
        if (item) item.qty++;
        else this.currentOrderItems.push({ menuId, qty: 1 });
        this.renderOrderItems();
    },

    changeQty(menuId, delta) {
        const item = this.currentOrderItems.find(i => i.menuId === menuId);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) {
                this.currentOrderItems = this.currentOrderItems.filter(i => i.menuId !== menuId);
            }
            this.renderOrderItems();
        }
    },

    renderOrderItems() {
        const container = document.getElementById('waiter-order-items');
        if (!container) return;

        const menu = store.getData('menu');
        container.innerHTML = '';

        if (this.currentOrderItems.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-70 mt-10">
                    <i data-lucide="shopping-basket" class="w-16 h-16 mb-4"></i>
                    <p>سبد سفارش خالی است</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        let totalAmount = 0;

        this.currentOrderItems.forEach(orderItem => {
            const menuItem = menu.find(m => m.id === orderItem.menuId);
            totalAmount += (menuItem.price * orderItem.qty);
            
            container.innerHTML += `
                <div class="flex flex-col bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div class="text-sm font-bold text-gray-800 mb-2">${menuItem.name}</div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500">${(menuItem.price * orderItem.qty).toLocaleString()} ت</span>
                        <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button onclick="waiter.changeQty(${orderItem.menuId}, -1)" class="w-7 h-7 flex items-center justify-center bg-white text-red-500 hover:bg-red-50 rounded shadow-sm transition-colors cursor-pointer">
                                <i data-lucide="${orderItem.qty === 1 ? 'trash-2' : 'minus'}" class="w-4 h-4"></i>
                            </button>
                            <span class="font-bold min-w-[1rem] text-center">${orderItem.qty}</span>
                            <button onclick="waiter.changeQty(${orderItem.menuId}, 1)" class="w-7 h-7 flex items-center justify-center bg-white text-green-600 hover:bg-green-50 rounded shadow-sm transition-colors cursor-pointer">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center font-bold text-lg text-indigo-800">
                <span>مبلغ کل:</span>
                <span>${totalAmount.toLocaleString()} ت</span>
            </div>
        `;
        
        lucide.createIcons();
    },

    saveOrder(orderId) {
        if (this.currentOrderItems.length === 0) return;

        let orders = store.getData('orders');
        let tables = store.getData('tables');

        if (orderId) {
            const orderIndex = orders.findIndex(o => o.id === orderId);
            orders[orderIndex].items = this.currentOrderItems;
        } else {
            orders.push({
                id: store.generateId(),
                tableId: this.currentTableId,
                items: this.currentOrderItems,
                status: 'cooking',
                timestamp: Date.now()
            });
            const tableIndex = tables.findIndex(t => t.id === this.currentTableId);
            tables[tableIndex].status = 'occupied';
        }

        store.setData('orders', orders);
        store.setData('tables', tables);
        app.closeModal();
        this.init();
    },

    markDelivered(orderId) {
        let orders = store.getData('orders');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'delivered';
            store.setData('orders', orders);
            this.init();
        }
    }
};
