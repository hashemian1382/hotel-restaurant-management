const app = {
    roles: {
        'admin': { title: 'مدیریت', viewId: 'admin-view', init: () => admin.init() },
        'waiter': { title: 'گارسون', viewId: 'waiter-view', init: () => waiter.init() },
        'kitchen': { title: 'آشپزخانه', viewId: 'kitchen-view', init: () => kitchen.init() },
        'cashier': { title: 'صندوق و حسابرسی', viewId: 'cashier-view', init: () => cashier.init() }
    },

    login(role) {
        document.getElementById('login-view').classList.add('hidden-view');
        document.getElementById('dashboard-layout').classList.remove('hidden-view');
        
        Object.keys(this.roles).forEach(r => {
            document.getElementById(this.roles[r].viewId).classList.add('hidden-view');
        });

        const activeRole = this.roles[role];
        document.getElementById('header-title').textContent = `داشبورد ${activeRole.title}`;
        document.getElementById(activeRole.viewId).classList.remove('hidden-view');
        
        activeRole.init();
        lucide.createIcons();

        if(role === 'kitchen' || role === 'waiter') {
            if(this.pollInterval) clearInterval(this.pollInterval);
            this.pollInterval = setInterval(() => activeRole.init(), 5000);
        }
    },

    logout() {
        if(this.pollInterval) clearInterval(this.pollInterval);
        document.getElementById('dashboard-layout').classList.add('hidden-view');
        document.getElementById('login-view').classList.remove('hidden-view');
    },

    openModal(title, bodyHtml, footerHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-footer').innerHTML = footerHtml;
        document.getElementById('modal-overlay').classList.remove('hidden-view');
        lucide.createIcons();
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden-view');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
});
