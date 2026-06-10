function recDash(container) {
    const today = todayStr();
    const ins = db.bookings.filter(b => b.checkIn <= today && b.status === 'upcoming');
    const outs = db.bookings.filter(b => b.checkOut === today && b.status === 'active');
    
    let html = `<div class="grid-2"><div class="card"><h3>ورودی‌های امروز و روزهای قبل (تاخیردار)</h3><table>`;
    ins.forEach(b => {
        const u = db.users.find(x => x.id === b.guestId); const r = db.rooms.find(x => x.id === b.roomId);
        const dateWarn = b.checkIn < today ? `<br><small style="color:red">تاریخ ورود: ${b.checkIn}</small>` : '';
        html += `<tr><td>${u ? u.name : '-'} ${dateWarn}</td><td>${r ? r.number : '-'}</td><td><button class="secondary" onclick="doCheckIn(${b.id})">پذیرش</button></td></tr>`;
    });

    html += `</table></div><div class="card"><h3>خروجی‌های امروز</h3><table>`;
    outs.forEach(b => {
        const u = db.users.find(x => x.id === b.guestId); const r = db.rooms.find(x => x.id === b.roomId);
        html += `<tr><td>${u ? u.name : '-'}</td><td>${r ? r.number : '-'}</td><td><button class="danger" onclick="doCheckOut(${b.id})">تسویه</button></td></tr>`;
    });
    container.innerHTML = html + `</table></div></div>`;
}

window.doCheckIn = function(bId) {
    const b = db.bookings.find(x => x.id === bId); const r = db.rooms.find(x => x.id === b.roomId);
    if(r.status !== 'available') return alert('اتاق آماده نیست!');
    b.status = 'active'; r.status = 'occupied'; saveDB(); recDash(document.getElementById('dynamic-content'));
};

window.doCheckOut = function(bId) {
    const b = db.bookings.find(x => x.id === bId); const r = db.rooms.find(x => x.id === b.roomId);
    const u = db.users.find(x => x.id === b.guestId);
    
    let extraCost = 0;
    db.restaurantOrders.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => { extraCost += x.amount; x.isPaid = true; });
    db.parkingRecords.filter(x => x.bookingId === b.id && !x.isPaid && x.cost).forEach(x => { extraCost += x.cost; x.isPaid = true; });
    db.amenityRecords.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => { extraCost += x.amount; x.isPaid = true; });
    
    if(db.parkingRecords.some(x => x.bookingId === b.id && !x.dateOut)) return alert('خودروی مهمان هنوز در پارکینگ است. ابتدا خروج ثبت شود.');
    
    if(extraCost > 0) {
        if(u.wallet >= extraCost) {
            u.wallet -= extraCost;
            db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -extraCost, type: 'کسر', desc: 'تسویه هزینه‌های جانبی اقامت', method: 'سیستم', date: nowStr() });
            alert(`هزینه‌های جانبی (${extraCost.toLocaleString()}) از کیف پول مهمان کسر شد.`);
        } else {
            return alert(`موجودی مهمان برای تسویه هزینه‌های جانبی کافی نیست.\nمبلغ بدهی: ${extraCost.toLocaleString()}\nابتدا حساب مهمان را شارژ کنید.`);
        }
    }
    
    if(confirm(`آیا تسویه نهایی انجام شود؟`)) {
        b.status = 'completed'; r.status = 'dirty';
        saveDB(); alert('تسویه نهایی و خروج ثبت شد.'); navigate('recDash');
    }
};

function recWalkIn(container) {
    let opts = '';
    db.rooms.filter(r => r.status === 'available').forEach(r => opts += `<option value="${r.id}">${r.number} - ${r.type} (${r.price.toLocaleString()} تومان)</option>`);
    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div class="form-group"><label>نام مهمان</label><input type="text" id="w-name"></div>
            <div class="form-group"><label>شماره تماس</label><input type="text" id="w-phone"></div>
            <div class="form-group"><label>اتاق (فقط آماده‌ها)</label><select id="w-room">${opts}</select></div>
            <div class="form-group"><label>تعداد شب اقامت</label><input type="number" id="w-nights" value="1" min="1"></div>
            <button onclick="saveWalkIn()" style="margin-top:1rem">دریافت هزینه و ثبت پذیرش</button>
        </div>
    `;
}

window.saveWalkIn = function() {
    const n = document.getElementById('w-name').value;
    const ph = document.getElementById('w-phone').value;
    const rId = parseInt(document.getElementById('w-room').value);
    const nights = parseInt(document.getElementById('w-nights').value);
    
    if(!n || !ph || isNaN(rId)) return alert('اطلاعات کامل نیست.');
    
    let u = db.users.find(x => x.phone === ph && x.role === 'guest');
    if(!u) { 
        const code = generateUserCode();
        u = { id: generateId(db.users), userCode: code, user: ph, pass: ph, role: 'guest', name: n, phone: ph, wallet: 0 }; 
        db.users.push(u); 
        alert(`مهمان جدید در سیستم ثبت شد.\nکد کاربری اختصاصی مهمان: ${code}\nرمز عبور پیش‌فرض: ${ph}`);
    }
    
    const r = db.rooms.find(x => x.id === rId);
    const cost = r.price * nights;
    
    u.wallet += cost;
    db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: cost, type: 'واریز', desc: 'پرداخت حضوری پذیرش', method: 'کارتخوان/نقدی', date: nowStr() });
    
    u.wallet -= cost;
    db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -cost, type: 'کسر', desc: 'هزینه رزرو حضوری', method: 'سیستم', date: nowStr() });

    const t = new Date();
    const jIn = jalaali.toJalaali(t);
    const cin = `${jIn.jy}/${jIn.jm < 10 ? '0' + jIn.jm : jIn.jm}/${jIn.jd < 10 ? '0' + jIn.jd : jIn.jd}`;
    t.setDate(t.getDate() + nights);
    const jOut = jalaali.toJalaali(t);
    const cout = `${jOut.jy}/${jOut.jm < 10 ? '0' + jOut.jm : jOut.jm}/${jOut.jd < 10 ? '0' + jOut.jd : jOut.jd}`;
    
    db.bookings.push({ id: generateId(db.bookings), guestId: u.id, roomId: r.id, checkIn: cin, checkOut: cout, totalCost: cost, status: 'active', penalty: 0, dateBooked: cin });
    r.status = 'occupied'; saveDB();
    alert('دریافت وجه و پذیرش با موفقیت انجام شد. کلید را تحویل دهید.'); navigate('recDash');
};

function recWallet(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 0 auto;">
            <h3>افزایش موجودی مهمان (کارتخوان/نقدی)</h3>
            <div class="form-group"><label>کد کاربری مهمان</label><input type="text" id="rw-code"></div>
            <div class="form-group"><label>مبلغ دریافتی (تومان)</label><input type="number" id="rw-amount"></div>
            <button onclick="addRecWallet()">ثبت افزایش موجودی</button>
        </div>
    `;
}

window.addRecWallet = function() {
    const code = document.getElementById('rw-code').value;
    const am = parseInt(document.getElementById('rw-amount').value);
    if(!code || !am || am <= 0) return alert('اطلاعات نامعتبر است.');
    const u = db.users.find(x => x.userCode === code && x.role === 'guest');
    if(!u) return alert('مهمان یافت نشد.');
    
    u.wallet += am;
    db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: am, type: 'واریز', desc: 'افزایش موجودی توسط پذیرش', method: 'کارتخوان/نقدی', date: nowStr() });
    saveDB();
    autoSettleDebts(u.id);
    alert('موجودی مهمان با موفقیت افزایش یافت و بدهی‌های احتمالی تسویه شد.');
    document.getElementById('rw-code').value = '';
    document.getElementById('rw-amount').value = '';
};

function recEarlyCheckout(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h3>تخلیه زودهنگام اتاق</h3>
            <div class="form-group"><label>کد کاربری مهمان</label><input type="text" id="ec-code"></div>
            <div class="form-group"><label>شماره اتاق</label><input type="text" id="ec-room"></div>
            <button onclick="checkEarlyDebt()">بررسی بدهی</button>
            <div id="ec-result" style="margin-top: 1.5rem;"></div>
        </div>
    `;
}

window.checkEarlyDebt = function() {
    const code = document.getElementById('ec-code').value;
    const roomNum = document.getElementById('ec-room').value;
    const u = db.users.find(x => x.userCode === code && x.role === 'guest');
    const r = db.rooms.find(x => x.number === roomNum);
    if(!u || !r) return alert('مهمان یا اتاق یافت نشد.');
    const b = db.bookings.find(x => x.guestId === u.id && x.roomId === r.id && x.status === 'active');
    if(!b) return alert('اقامت فعالی برای این مهمان در این اتاق یافت نشد.');
    
    let debt = 0;
    db.restaurantOrders.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => debt += x.amount);
    db.parkingRecords.filter(x => x.bookingId === b.id && !x.isPaid && x.cost).forEach(x => debt += x.cost);
    db.amenityRecords.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => debt += x.amount);
    
    let res = document.getElementById('ec-result');
    let html = `<div style="padding: 1rem; border: 1px solid var(--border); border-radius: 4px;"><p>موجودی کیف پول: ${u.wallet.toLocaleString()}</p><p>مجموع بدهی امکانات: ${debt.toLocaleString()}</p>`;
    
    if(debt > 0) {
        if(u.wallet >= debt) {
            html += `<button class="danger" onclick="doCheckOut(${b.id})">کسر از کیف پول و تخلیه</button>`;
        } else {
            let diff = debt - u.wallet;
            html += `<p style="color:red; font-weight:bold;">کسری موجودی جهت تسویه: ${diff.toLocaleString()}</p>`;
            html += `<button class="primary" onclick="payAndCheckout(${b.id}, ${diff})">دریافت حضوری ${diff.toLocaleString()} و تخلیه</button>`;
        }
    } else {
        html += `<button class="danger" onclick="doCheckOut(${b.id})">تخلیه اتاق</button>`;
    }
    html += `</div>`;
    res.innerHTML = html;
};

window.payAndCheckout = function(bId, diffAmount) {
    const b = db.bookings.find(x => x.id === bId);
    const u = db.users.find(x => x.id === b.guestId);
    u.wallet += diffAmount;
    db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: diffAmount, type: 'واریز', desc: 'افزایش موجودی برای تسویه زودهنگام', method: 'کارتخوان/نقدی', date: nowStr() });
    saveDB();
    autoSettleDebts(u.id);
    doCheckOut(bId);
};
