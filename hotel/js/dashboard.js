let currentView = '';

window.onload = () => { if (!db.currentUser) { window.location.href = 'index.html'; return; } loadApp(); };

function logout() { db.currentUser = null; saveDB(); window.location.href = 'index.html'; }

function loadApp() {
    const userInDb = db.users.find(x => x.id === db.currentUser.id);
    if(userInDb) db.currentUser = userInDb;

    document.getElementById('current-user-name').innerText = db.currentUser.name;
    const roleMap = { manager: 'مدیریت', reception: 'پذیرش', service: 'خدمات', guest: 'مهمان', restaurant: 'رستوران', parking: 'پارکینگ', amenity: 'امکانات رفاهی' };
    document.getElementById('current-user-role').innerText = roleMap[db.currentUser.role] + ` (کد: ${db.currentUser.userCode || '-'})`;
    document.getElementById('current-user-avatar').innerText = db.currentUser.name.charAt(0);
    
    const wb = document.getElementById('wallet-balance');
    if (db.currentUser.role === 'guest') {
        wb.style.display = 'block';
        wb.innerText = `موجودی: ${db.currentUser.wallet.toLocaleString()} تومان`;
    } else {
        wb.style.display = 'none';
    }

    buildMenu();
    
    const r = db.currentUser.role;
    if (r === 'guest') navigate('guestSearch');
    else if (r === 'reception') navigate('recDash');
    else if (r === 'service') navigate('servTasks');
    else if (r === 'restaurant') navigate('restDash');
    else if (r === 'parking') navigate('parkDash');
    else if (r === 'amenity') navigate('amenityDash');
    else navigate('mgrDash');
}

function buildMenu() {
    const menu = document.getElementById('sidebar-menu');
    menu.innerHTML = '';
    const add = (id, text) => menu.innerHTML += `<li><a href="#" id="menu-${id}" onclick="navigate('${id}')">${text}</a></li>`;
    const r = db.currentUser.role;
    if (r === 'guest') { add('guestSearch', 'جستجو و رزرو'); add('guestHistory', 'تاریخچه رزروها'); add('walletDash', 'کیف پول و تراکنش‌ها'); }
    if (r === 'reception') { add('recDash', 'پیشخوان پذیرش'); add('recWalkIn', 'پذیرش حضوری'); add('recWallet', 'افزایش موجودی مهمان'); add('recEarlyCheckout', 'تخلیه زودهنگام'); }
    if (r === 'service') { add('servTasks', 'خدمات و اتاق‌ها'); }
    if (r === 'restaurant') { add('restDash', 'ثبت سفارش'); }
    if (r === 'parking') { add('parkDash', 'ورود و خروج'); add('parkTariffs', 'تعرفه‌ها'); }
    if (r === 'amenity') { add('amenityDash', 'ثبت خدمات'); }
    if (r === 'manager') { add('mgrDash', 'گزارشات'); add('mgrRooms', 'اتاق‌ها'); add('mgrUsers', 'کاربران'); }
    add('profileSettings', 'تنظیمات پروفایل');
}

function navigate(viewId) {
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if(document.getElementById(`menu-${viewId}`)) document.getElementById(`menu-${viewId}`).classList.add('active');
    const content = document.getElementById('dynamic-content');
    const titles = {
        guestSearch: 'جستجو و رزرو اتاق', guestHistory: 'تاریخچه رزروهای من', walletDash: 'کیف پول حساب',
        recDash: 'پیشخوان امروز', recWalkIn: 'پذیرش حضوری', recWallet: 'افزایش موجودی مهمان', recEarlyCheckout: 'تخلیه زودهنگام اتاق', servTasks: 'لیست وظایف',
        restDash: 'مدیریت رستوران', parkDash: 'مدیریت پارکینگ', parkTariffs: 'تعرفه‌های پارکینگ',
        amenityDash: 'امکانات رفاهی', mgrDash: 'نمای کلی هتل', mgrRooms: 'مدیریت اتاق‌ها', mgrUsers: 'مدیریت کاربران',
        profileSettings: 'پروفایل من'
    };
    document.getElementById('page-title').innerText = titles[viewId] || '';
    currentView = viewId;
    if(window[viewId]) window[viewId](content);
}

function getStatusBadge(status) {
    const map = {
        available: { c: 'available', t: 'آماده' }, occupied: { c: 'occupied', t: 'اشغال' },
        dirty: { c: 'dirty', t: 'نظافت' }, maintenance: { c: 'maintenance', t: 'تعمیر' },
        upcoming: { c: 'active', t: 'پیش‌رو' }, active: { c: 'occupied', t: 'در حال اقامت' },
        completed: { c: 'completed', t: 'پایان یافته' }, cancelled: { c: 'cancelled', t: 'لغو شده' }
    };
    const s = map[status] || { c: '', t: status };
    return `<span class="badge ${s.c}">${s.t}</span>`;
}

function openModal(title, html) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('main-modal').classList.add('show');
}
function closeModal() { document.getElementById('main-modal').classList.remove('show'); }

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function profileSettings(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 0 auto;">
            <div class="form-group"><label>نام و نام خانوادگی</label><input type="text" id="prof-name" value="${db.currentUser.name}"></div>
            <div class="form-group"><label>شماره تماس</label><input type="text" id="prof-phone" value="${db.currentUser.phone}"></div>
            <div class="form-group"><label>رمز عبور جدید</label><input type="password" id="prof-pass"></div>
            <button onclick="saveProfile()">بروزرسانی</button>
        </div>
    `;
}
window.saveProfile = function() {
    db.currentUser.name = document.getElementById('prof-name').value;
    db.currentUser.phone = document.getElementById('prof-phone').value;
    const p = document.getElementById('prof-pass').value;
    if(p) db.currentUser.pass = p;
    const u = db.users.find(x => x.id === db.currentUser.id);
    Object.assign(u, db.currentUser);
    saveDB(); alert('پروفایل بروزرسانی شد.'); loadApp();
};
