const cashier = {
    currentOrder: null,

    init() {
        this.renderTablesList();
        document.getElementById('cashier-invoice-details').innerHTML = '<p class="text-gray-400 text-center py-10">یک میز را انتخاب کنید</p>';
        this.currentOrder = null;
    },

    renderTablesList() {
        const tables = store.getData('tables').filter(t => t.status !== 'free');
        const list = document.getElementById('cashier-tables-list');
        list.innerHTML = '';

        if (tables.length === 0) {
            list.innerHTML = '<div class="text-sm text-gray-500">میز فعالی وجود ندارد.</div>';
            return;
        }

        tables.forEach(table => {
            const btn = document.createElement('button');
            const isWaiting = table.status === 'waiting';
            btn.className = `w-full text-right p-3 rounded-lg border mb-2 flex justify-between items-center hover:bg-gray-50 ${isWaiting ? 'bg-yellow-50 border-yellow-300' : 'bg-white'}`;
            btn.innerHTML = `
                <span class="font-bold">میز ${table.id}</span>
                <span class="text-xs ${isWaiting ? 'text-yellow-600' : 'text-gray-500'}">${isWaiting ? 'منتظر تسویه' : 'مشغول'}</span>
            `;
            btn.onclick = () => this.loadInvoice(table.id);
            list.appendChild(btn);
        });
    },

    loadInvoice(tableId) {
        const orders = store.getData('orders');
        this.currentOrder = orders.find(o => o.tableId === tableId && o.status !== 'paid');
        
        if (!this.currentOrder) return;

        let tables = store.getData('tables');
        const tableIndex = tables.findIndex(t => t.id === tableId);
        if (tables[tableIndex].status !== 'waiting') {
            tables[tableIndex].status = 'waiting';
            store.setData('tables', tables);
            this.renderTablesList();
        }

        const menu = store.getData('menu');
        let total = 0;
        let itemsHtml = '';

        this.currentOrder.items.forEach(i => {
            const menuItem = menu.find(m => m.id === i.menuId);
            if (menuItem) {
                const subTotal = menuItem.price * i.qty;
                total += subTotal;
                itemsHtml += `
                    <div class="flex justify-between items-center py-2 border-b">
                        <div>
                            <div class="font-bold">${menuItem.name}</div>
                            <div class="text-xs text-gray-500">${i.qty} عدد × ${parseInt(menuItem.price).toLocaleString()}</div>
                        </div>
                        <div>${subTotal.toLocaleString()} ت</div>
                    </div>
                `;
            }
        });

        this.currentOrder.total = total;

        const container = document.getElementById('cashier-invoice-details');
        container.innerHTML = `
            <div class="mb-4">
                <h4 class="text-xl font-bold border-b pb-2 mb-4">میز ${tableId}</h4>
                <div class="space-y-2 mb-6 h-64 overflow-y-auto pr-2">${itemsHtml}</div>
                <div class="bg-gray-100 p-4 rounded-lg">
                    <div class="flex justify-between mb-2"><span>جمع کل:</span> <span class="font-bold">${total.toLocaleString()} تومان</span></div>
                    <div class="flex justify-between items-center mb-4">
                        <span>تخفیف (٪):</span>
                        <input type="number" id="cashier-discount" class="w-20 p-1 border rounded text-center" value="0" min="0" max="100" onchange="cashier.updateTotal()">
                    </div>
                    <div class="flex justify-between text-lg font-bold text-indigo-700 pt-2 border-t border-gray-300">
                        <span>مبلغ قابل پرداخت:</span>
                        <span id="cashier-final-total">${total.toLocaleString()} تومان</span>
                    </div>
                </div>
            </div>
            <button onclick="cashier.checkout()" class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 flex justify-center gap-2 font-bold">
                <i data-lucide="credit-card"></i> تسویه نهایی
            </button>
        `;
        lucide.createIcons();
    },

    updateTotal() {
        if (!this.currentOrder) return;
        const discountInput = document.getElementById('cashier-discount').value;
        const discount = Math.min(100, Math.max(0, parseInt(discountInput) || 0));
        const finalTotal = this.currentOrder.total * (1 - discount / 100);
        document.getElementById('cashier-final-total').textContent = finalTotal.toLocaleString() + ' تومان';
        this.currentOrder.finalTotal = finalTotal;
    },

    checkout() {
        if (!this.currentOrder) return;

        const finalTotal = this.currentOrder.finalTotal || this.currentOrder.total;

        let orders = store.getData('orders');
        const orderIndex = orders.findIndex(o => o.id === this.currentOrder.id);
        orders[orderIndex].status = 'paid';
        orders[orderIndex].finalPaid = finalTotal;
        store.setData('orders', orders);

        let tables = store.getData('tables');
        const tableIndex = tables.findIndex(t => t.id === this.currentOrder.tableId);
        tables[tableIndex].status = 'free';
        store.setData('tables', tables);

        let sales = parseInt(localStorage.getItem('restaurant_sales'));
        sales += finalTotal;
        localStorage.setItem('restaurant_sales', sales.toString());

        this.init();
    }
};
