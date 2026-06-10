function restDash(container) {
    container.innerHTML = `
        <div class="card" style="max-width:500px; margin:0 auto;">
            <h3>ثبت سفارش رستوران</h3>
            <div class="form-group"><label>کد کاربری ۶ رقمی مهمان</label><input type="text" id="r-code"></div>
            <div class="form-group"><label>شماره اتاق</label><input type="text" id="r-room"></div>
            <div class="form-group"><label>کد پیگیری داخلی سیستم رستوران</label><input type="text" id="r-track"></div>
            <div class="form-group"><label>مبلغ کل (تومان)</label><input type="number" id="r-amount"></div>
            <button onclick="saveRestOrder()">ثبت سفارش</button>
        </div>
    `;
}
window.saveRestOrder = function() {
    const code = document.getElementById('r-code').value; 
    const roomNum = document.getElementById('r-room').value; 
    const tr = document.getElementById('r-track').value; 
    const am = parseInt(document.getElementById('r-amount').value);
    
    if(!code || !roomNum || !tr || !am) return alert('لطفا همه موارد را پر کنید');
    const u = db.users.find(x => x.userCode === code);
    if(!u) return alert('کد کاربری یافت نشد.');
    const r = db.rooms.find(x => x.number === roomNum);
    if(!r) return alert('شماره اتاق یافت نشد.');
    
    const b = db.bookings.find(x => x.guestId === u.id && x.roomId === r.id && x.status === 'active');
    if(!b) return alert('اقامت فعالی برای این کاربر در این اتاق یافت نشد.');

    let isPaid = false;
    if(u.wallet >= am) {
        u.wallet -= am;
        db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -am, type: 'کسر', desc: 'سفارش رستوران', method: 'سیستم', date: nowStr() });
        isPaid = true;
    }

    db.restaurantOrders.push({ id: generateId(db.restaurantOrders), userId: u.id, bookingId: b.id, trackingCode: tr, amount: am, date: todayStr(), isPaid: isPaid });
    saveDB(); 
    alert(isPaid ? 'مبلغ سفارش از کیف پول کاربر کسر شد و پرداخت شد.' : 'موجودی کافی نبود. مبلغ در بدهی اتاق ثبت شد.'); 
    document.getElementById('r-code').value=''; document.getElementById('r-room').value=''; document.getElementById('r-track').value=''; document.getElementById('r-amount').value='';
};
