const kitchen = {
    init() {
        this.renderQueue();
    },

    renderQueue() {
        const orders = store.getData('orders')
            .filter(o => o.status === 'cooking')
            .sort((a, b) => a.timestamp - b.timestamp);
        
        const grid = document.getElementById('kitchen-orders-grid');
        grid.innerHTML = '';
        const menu = store.getData('menu');

        if (orders.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">سفارشی در صف نیست</div>';
            return;
        }

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'bg-white p-5 rounded-xl shadow-sm border-t-4 border-orange-500 flex flex-col';
            
            let itemsHtml = '<ul class="space-y-2 mb-4 flex-1">';
            order.items.forEach(i => {
                const menuItem = menu.find(m => m.id === i.menuId);
                itemsHtml += `
                    <li class="flex justify-between border-b pb-1 text-sm">
                        <span>${menuItem ? menuItem.name : 'حذف شده'}</span>
                        <span class="font-bold">${i.qty}x</span>
                    </li>
                `;
            });
            itemsHtml += '</ul>';

            const timeString = new Date(order.timestamp).toLocaleTimeString('fa-IR');

            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold text-lg">میز ${order.tableId}</h4>
                    <span class="text-xs text-gray-500">${timeString}</span>
                </div>
                ${itemsHtml}
                <button onclick="kitchen.markReady(${order.id})" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                    <i data-lucide="check-circle" class="w-5 h-5"></i> آماده تحویل
                </button>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    },

    markReady(orderId) {
        let orders = store.getData('orders');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'ready';
            store.setData('orders', orders);
            this.renderQueue();
        }
    }
};
