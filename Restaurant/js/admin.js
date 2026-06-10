const admin = {
    init() {
        this.renderMenu();
        this.renderSales();
    },

    renderSales() {
        const sales = localStorage.getItem('restaurant_sales');
        document.getElementById('admin-total-sales').textContent = parseInt(sales).toLocaleString() + ' تومان';
    },

    renderMenu() {
        const menu = store.getData('menu');
        const tbody = document.getElementById('admin-menu-list');
        tbody.innerHTML = '';

        menu.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="p-3">${item.name}</td>
                <td class="p-3"><span class="bg-gray-100 px-2 py-1 rounded text-sm">${item.category}</span></td>
                <td class="p-3">${parseInt(item.price).toLocaleString()}</td>
                <td class="p-3">
                    <button onclick="admin.toggleAvailable(${item.id})" class="px-3 py-1 rounded-full text-sm ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${item.available ? 'موجود' : 'ناموجود'}
                    </button>
                </td>
                <td class="p-3">
                    <button onclick="admin.deleteItem(${item.id})" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        lucide.createIcons();
    },

    toggleAvailable(id) {
        const menu = store.getData('menu');
        const item = menu.find(i => i.id === id);
        if (item) {
            item.available = !item.available;
            store.setData('menu', menu);
            this.renderMenu();
        }
    },

    deleteItem(id) {
        let menu = store.getData('menu');
        menu = menu.filter(i => i.id !== id);
        store.setData('menu', menu);
        this.renderMenu();
    },

    openMenuModal() {
        const body = `
            <div class="space-y-4">
                <div><label class="block text-sm mb-1">نام غذا</label><input type="text" id="add-name" class="w-full border rounded p-2"></div>
                <div><label class="block text-sm mb-1">دسته‌بندی</label>
                    <select id="add-category" class="w-full border rounded p-2">
                        <option>چلو کباب و ایرانی</option>
                        <option>فست‌فود</option>
                        <option>پیش‌غذا و سالاد</option>
                        <option>نوشیدنی‌ها</option>
                        <option>کافه و دسر</option>
                    </select>
                </div>
                <div><label class="block text-sm mb-1">قیمت (تومان)</label><input type="number" id="add-price" class="w-full border rounded p-2"></div>
            </div>
        `;
        const footer = `
            <button onclick="app.closeModal()" class="px-4 py-2 text-gray-600">انصراف</button>
            <button onclick="admin.saveItem()" class="px-4 py-2 bg-indigo-600 text-white rounded">ذخیره</button>
        `;
        app.openModal('افزودن غذای جدید', body, footer);
    },

    saveItem() {
        const name = document.getElementById('add-name').value;
        const category = document.getElementById('add-category').value;
        const price = document.getElementById('add-price').value;

        if (!name || !price) return;

        const menu = store.getData('menu');
        menu.push({
            id: store.generateId(),
            name,
            category,
            price: parseInt(price),
            available: true
        });
        store.setData('menu', menu);
        app.closeModal();
        this.renderMenu();
    },


    exportMenu() {
        const menu = store.getData('menu');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(menu, null, 2));
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "restaurant_menu_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    importMenu(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const newMenu = JSON.parse(e.target.result);
                
                if (Array.isArray(newMenu)) {
                    store.setData('menu', newMenu);
                    this.renderMenu();
                    alert("منو با موفقیت بروزرسانی شد.");
                } else {
                    alert("ساختار فایل نامعتبر است. فایل باید شامل یک لیست (آرایه) باشد.");
                }
            } catch (error) {
                alert("خطا در خواندن فایل JSON. لطفا فایل معتبری انتخاب کنید.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

};
