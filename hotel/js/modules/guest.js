function guestSearch(container) {
    container.innerHTML = `
        <div class="card">
            <div class="grid-4">
                <div class="form-group"><label>تاریخ ورود</label><input type="text" id="s-in" placeholder="1400/01/01"></div>
                <div class="form-group"><label>تاریخ خروج</label><input type="text" id="s-out" placeholder="1400/01/02"></div>
                <div class="form-group"><label>ظرفیت</label><input type="number" id="s-cap" min="1" value="1"></div>
                <div class="form-group"><label>حداکثر قیمت هر شب</label><input type="number" id="s-price" value="5000000"></div>
            </div>
            <button onclick="doGuestSearch()">جستجو</button>
        </div>
        <div id="search-results" class="grid-3"></div>
    `;

    setTimeout(() => {
        const dpOptions = { buttonsColor: "var(--primary)", forceFarsiDigits: true, markToday: true, markHolidays: true, highlightSelectedDay: true, sync: true, gotoToday: true };
        kamaDatepicker('s-in', dpOptions);
        kamaDatepicker('s-out', dpOptions);
    }, 100);
}

window.doGuestSearch = function() {
    const cin = document.getElementById('s-in').value; const cout = document.getElementById('s-out').value;
    const cap = parseInt(document.getElementById('s-cap').value); const price = parseInt(document.getElementById('s-price').value);
    if (!cin || !cout || cin >= cout) return alert('تاریخ‌ها را بررسی کنید.');
    const res = document.getElementById('search-results'); res.innerHTML = '';
    const available = db.rooms.filter(r => {
        if (r.capacity < cap || r.price > price) return false;
        const conflicts = db.bookings.filter(b => b.roomId === r.id && b.status !== 'cancelled' && b.status !== 'completed');
        return !conflicts.some(b => (cin >= b.checkIn && cin < b.checkOut) || (cout > b.checkIn && cout <= b.checkOut) || (cin <= b.checkIn && cout >= b.checkOut));
    });
    if(!available.length) return res.innerHTML = '<p>اتاقی یافت نشد.</p>';
    available.forEach(r => {
        const days = Math.ceil((parseJalali(cout) - parseJalali(cin)) / 86400000); const total = r.price * days;
        res.innerHTML += `<div class="room-card"><h3>اتاق ${r.number}</h3><p>ظرفیت: ${r.capacity}</p><div class="room-price">${total.toLocaleString()} تومان</div><button onclick="bookRoom(${r.id}, '${cin}', '${cout}', ${total})">رزرو این اتاق</button></div>`;
    });
};

window.bookRoom = function(rId, cin, cout, total) {
    if(db.currentUser.wallet < total) {
        return alert(`موجودی کیف پول شما کافی نیست.\nمبلغ مورد نیاز: ${total.toLocaleString()} تومان`);
    }
    db.currentUser.wallet -= total;
    db.users.find(x => x.id === db.currentUser.id).wallet = db.currentUser.wallet;
    db.transactions.push({ id: generateId(db.transactions), userId: db.currentUser.id, amount: -total, type: 'کسر', desc: 'هزینه رزرو اتاق', method: 'سیستم', date: nowStr() });
    db.bookings.push({ id: generateId(db.bookings), guestId: db.currentUser.id, roomId: rId, checkIn: cin, checkOut: cout, totalCost: total, status: 'upcoming', penalty: 0, dateBooked: todayStr() });
    saveDB(); alert('رزرو با موفقیت ثبت شد و مبلغ از کیف پول کسر گردید.'); loadApp(); navigate('guestHistory');
};

function guestHistory(container) {
    const myB = db.bookings.filter(b => b.guestId === db.currentUser.id).sort((a,b) => b.id - a.id);
    let html = `<div class="card"><table><tr><th>اتاق</th><th>ورود</th><th>خروج</th><th>مبلغ</th><th>وضعیت</th><th>جزئیات</th><th>عملیات</th></tr>`;
    myB.forEach(b => {
        const r = db.rooms.find(x => x.id === b.roomId);
        const canCancel = b.status === 'upcoming';
        html += `<tr><td>${r ? r.number : '-'}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.totalCost.toLocaleString()}</td><td>${getStatusBadge(b.status)}</td><td><button class="outline" onclick="showBookingDetails(${b.id})">مشاهده</button></td><td>${canCancel ? `<button class="danger" onclick="cancelGuestBooking(${b.id})">لغو</button>` : '-'}</td></tr>`;
    });
    container.innerHTML = html + `</table></div>`;
}

window.cancelGuestBooking = function(bId) {
    const b = db.bookings.find(x => x.id === bId);
    const diffDays = Math.ceil((parseJalali(b.checkIn) - new Date().setHours(0,0,0,0)) / 86400000);
    let penaltyPercent = 0;
    if(diffDays <= 1) penaltyPercent = 50;
    else if(diffDays <= 3) penaltyPercent = 20;
    const penalty = (b.totalCost * penaltyPercent) / 100;
    const refund = b.totalCost - penalty;

    if(confirm(`آیا از لغو این رزرو اطمینان دارید؟\nدرصد جریمه: ${penaltyPercent}%\nمبلغ جریمه: ${penalty.toLocaleString()}\nمبلغ بازگشتی: ${refund.toLocaleString()}`)) {
        b.status = 'cancelled';
        b.penalty = penalty;
        db.currentUser.wallet += refund;
        db.users.find(x => x.id === db.currentUser.id).wallet = db.currentUser.wallet;
        db.transactions.push({ id: generateId(db.transactions), userId: db.currentUser.id, amount: refund, type: 'واریز', desc: `بازگشت وجه لغو رزرو`, method: 'سیستم', date: nowStr() });
        saveDB(); alert('رزرو لغو شد و مبلغ به کیف پول بازگشت.'); loadApp(); navigate('guestHistory');
    }
};

window.showBookingDetails = function(bId) {
    const b = db.bookings.find(x => x.id === bId);
    const r = db.rooms.find(x => x.id === b.roomId);
    
    let rests = db.restaurantOrders.filter(x => x.bookingId === b.id);
    let restHtml = rests.length ? rests.map(x => `<tr><td>${x.trackingCode}</td><td>${x.date}</td><td>${x.amount.toLocaleString()}</td><td>${x.isPaid?'پرداخت شده':'بدهی'}</td></tr>`).join('') : '<tr><td colspan="4">موردی یافت نشد</td></tr>';
    
    let parks = db.parkingRecords.filter(x => x.bookingId === b.id);
    let parkHtml = parks.length ? parks.map(x => `<tr><td>${x.carType}</td><td>${x.dateIn}</td><td>${x.dateOut||'-'}</td><td>${x.cost?x.cost.toLocaleString():'-'}</td><td>${x.isPaid?'پرداخت شده':'بدهی'}</td></tr>`).join('') : '<tr><td colspan="5">موردی یافت نشد</td></tr>';
    
    let ams = db.amenityRecords.filter(x => x.bookingId === b.id);
    let amHtml = ams.length ? ams.map(x => `<tr><td>${x.desc}</td><td>${x.date}</td><td>${x.amount.toLocaleString()}</td><td>${x.isPaid?'پرداخت شده':'بدهی'}</td></tr>`).join('') : '<tr><td colspan="4">موردی یافت نشد</td></tr>';

    openModal('جزئیات اقامت', `
        <div style="margin-bottom:1rem"><b>اتاق:</b> ${r.number} | <b>ورود:</b> ${b.checkIn} | <b>خروج:</b> ${b.checkOut} | <b>وضعیت:</b> ${getStatusBadge(b.status)}</div>
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('t-rest')">رستوران</button>
            <button class="tab-btn" onclick="switchTab('t-park')">پارکینگ</button>
            <button class="tab-btn" onclick="switchTab('t-am')">امکانات رفاهی</button>
        </div>
        <div id="t-rest" class="tab-content active"><table><tr><th>کد پیگیری</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr>${restHtml}</table></div>
        <div id="t-park" class="tab-content"><table><tr><th>خودرو</th><th>ورود</th><th>خروج</th><th>مبلغ</th><th>وضعیت</th></tr>${parkHtml}</table></div>
        <div id="t-am" class="tab-content"><table><tr><th>شرح</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr>${amHtml}</table></div>
    `);
};

function walletDash(container) {
    let html = `
        <div class="grid-2">
            <div class="card">
                <h3>افزایش موجودی</h3>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="w-amount" value="1000000"></div>
                <button onclick="addGuestFunds()">پرداخت از درگاه اینترنتی</button>
            </div>
            <div class="card">
                <h3>تراکنش‌های اخیر</h3>
                <table><tr><th>تاریخ</th><th>شرح</th><th>روش</th><th>مبلغ</th></tr>
    `;
    const myTrans = db.transactions.filter(t => t.userId === db.currentUser.id).sort((a,b) => b.id - a.id);
    myTrans.forEach(t => {
        const color = t.amount >= 0 ? 'green' : 'red';
        html += `<tr><td>${t.date}</td><td>${t.desc}</td><td>${t.method}</td><td style="color:${color}; font-weight:bold;" dir="ltr">${t.amount > 0 ? '+' : ''}${t.amount.toLocaleString()}</td></tr>`;
    });
    html += `</table></div></div>`;
    container.innerHTML = html;
}

window.addGuestFunds = function() {
    const am = parseInt(document.getElementById('w-amount').value);
    if(!am || am <= 0) return alert('مبلغ نامعتبر است.');
    db.currentUser.wallet += am;
    db.users.find(x => x.id === db.currentUser.id).wallet = db.currentUser.wallet;
    db.transactions.push({ id: generateId(db.transactions), userId: db.currentUser.id, amount: am, type: 'واریز', desc: 'افزایش موجودی', method: 'درگاه اینترنتی', date: nowStr() });
    saveDB(); 
    autoSettleDebts(db.currentUser.id);
    alert('مبلغ با موفقیت به کیف پول اضافه شد و در صورت وجود بدهی تسویه گردید.'); 
    loadApp(); 
    navigate('walletDash');
};
