function parkDash(container) {
    let tOpts = db.parkingTariffs.map(t => `<option value="${t.id}">${t.name} - هر ${t.hours} ساعت: ${t.price.toLocaleString()}</option>`).join('');
    let activeParks = db.parkingRecords.filter(p => !p.dateOut);
    let html = `
        <div class="grid-2">
            <div class="card">
                <h3>ثبت ورود خودرو</h3>
                <div class="form-group"><label>کد کاربری مهمان</label><input type="text" id="p-code"></div>
                <div class="form-group"><label>شماره اتاق</label><input type="text" id="p-room"></div>
                <div class="form-group"><label>نوع و پلاک ماشین</label><input type="text" id="p-car"></div>
                <div class="form-group"><label>تعرفه ورود</label><select id="p-tar">${tOpts}</select></div>
                <button onclick="saveParkIn()">ثبت ورود</button>
            </div>
            <div class="card">
                <h3>خودروهای داخل پارکینگ</h3><table><tr><th>کد کاربر</th><th>ماشین</th><th>تاریخ ورود</th><th>عملیات</th></tr>
    `;
    activeParks.forEach(p => {
        const u = db.users.find(x => x.id === p.userId);
        html += `<tr><td>${u?u.userCode:'-'}</td><td>${p.carType}</td><td>${p.dateIn}</td><td><button class="danger" style="padding:0.25rem 0.5rem" onclick="saveParkOut(${p.id})">ثبت خروج</button></td></tr>`;
    });
    container.innerHTML = html + `</table></div></div>`;
}
window.saveParkIn = function() {
    const code = document.getElementById('p-code').value; 
    const roomNum = document.getElementById('p-room').value; 
    const car = document.getElementById('p-car').value; 
    const tid = parseInt(document.getElementById('p-tar').value);
    
    if(!code || !roomNum || !car) return alert('اطلاعات ناقص است.');
    const u = db.users.find(x => x.userCode === code); if(!u) return alert('کد کاربری مهمان یافت نشد.');
    const r = db.rooms.find(x => x.number === roomNum); if(!r) return alert('شماره اتاق یافت نشد.');
    const b = db.bookings.find(x => x.guestId === u.id && x.roomId === r.id && x.status === 'active');
    if(!b) return alert('اقامت فعالی برای این کاربر در این اتاق یافت نشد.');

    db.parkingRecords.push({ id: generateId(db.parkingRecords), userId: u.id, bookingId: b.id, carType: car, tariffId: tid, dateIn: nowStr(), tsIn: Date.now(), dateOut: null, cost: 0, isPaid: false });
    saveDB(); parkDash(document.getElementById('dynamic-content'));
};
window.saveParkOut = function(pId) {
    const p = db.parkingRecords.find(x => x.id === pId);
    const t = db.parkingTariffs.find(x => x.id === p.tariffId);
    const u = db.users.find(x => x.id === p.userId);
    p.dateOut = nowStr();
    let hoursDiff = Math.ceil((Date.now() - p.tsIn) / 3600000); if(hoursDiff < 1) hoursDiff = 1;
    let multiplier = Math.ceil(hoursDiff / t.hours);
    p.cost = multiplier * t.price;
    
    if(u.wallet >= p.cost) {
        u.wallet -= p.cost;
        p.isPaid = true;
        db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -p.cost, type: 'کسر', desc: 'هزینه پارکینگ', method: 'سیستم', date: nowStr() });
        alert(`خروج ثبت شد.\nمبلغ ${p.cost.toLocaleString()} تومان محاسبه و از کیف پول کسر شد.`);
    } else {
        alert(`خروج ثبت شد.\nمبلغ ${p.cost.toLocaleString()} تومان محاسبه شد. بدلیل موجودی ناکافی در بدهی اتاق ثبت گردید.`);
    }

    saveDB(); 
    parkDash(document.getElementById('dynamic-content'));
};

function parkTariffs(container) {
    let html = `<div class="card"><button onclick="editTariff(null)" style="width:auto; margin-bottom:1rem">+ افزودن تعرفه جدید</button><table><tr><th>نام تعرفه</th><th>بازه (ساعت)</th><th>مبلغ (تومان)</th></tr>`;
    db.parkingTariffs.forEach(t => html += `<tr><td>${t.name}</td><td>${t.hours}</td><td>${t.price.toLocaleString()}</td></tr>`);
    container.innerHTML = html + `</table></div>`;
}
window.editTariff = function() {
    openModal('تعرفه جدید', `
        <div class="form-group"><label>نام تعرفه</label><input type="text" id="t-name"></div>
        <div class="form-group"><label>بازه زمانی (چند ساعت؟)</label><input type="number" id="t-hrs" min="1" value="1"></div>
        <div class="form-group"><label>مبلغ</label><input type="number" id="t-price"></div>
        <button onclick="saveTariff()">ذخیره تعرفه</button>
    `);
}
window.saveTariff = function() {
    db.parkingTariffs.push({ id: generateId(db.parkingTariffs), name: document.getElementById('t-name').value, hours: parseInt(document.getElementById('t-hrs').value), price: parseInt(document.getElementById('t-price').value) });
    saveDB(); closeModal(); parkTariffs(document.getElementById('dynamic-content'));
};
