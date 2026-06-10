function amenityDash(container) {
    container.innerHTML = `
        <div class="card" style="max-width:500px; margin:0 auto;">
            <h3>ثبت خدمات (${db.currentUser.name})</h3>
            <div class="form-group"><label>کد کاربری ۶ رقمی مهمان</label><input type="text" id="a-code"></div>
            <div class="form-group"><label>شماره اتاق</label><input type="text" id="a-room"></div>
            <div class="form-group"><label>شرح خدمت یا امکانات دریافت شده</label><input type="text" id="a-desc"></div>
            <div class="form-group"><label>مبلغ کل (تومان)</label><input type="number" id="a-amount"></div>
            <button onclick="saveAmenity()">ثبت هزینه در حساب مهمان</button>
        </div>
    `;
}
window.saveAmenity = function() {
    const code = document.getElementById('a-code').value; 
    const roomNum = document.getElementById('a-room').value;
    const d = document.getElementById('a-desc').value; 
    const am = parseInt(document.getElementById('a-amount').value);
    
    if(!code || !roomNum || !d || !am) return alert('همه موارد را وارد کنید.');
    const u = db.users.find(x => x.userCode === code); if(!u) return alert('کد کاربری یافت نشد.');
    const r = db.rooms.find(x => x.number === roomNum); if(!r) return alert('شماره اتاق یافت نشد.');
    const b = db.bookings.find(x => x.guestId === u.id && x.roomId === r.id && x.status === 'active');
    if(!b) return alert('اقامت فعالی برای این کاربر در این اتاق یافت نشد.');

    let isPaid = false;
    if(u.wallet >= am) {
        u.wallet -= am;
        db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -am, type: 'کسر', desc: `خدمات رفاهی: ${d}`, method: 'سیستم', date: nowStr() });
        isPaid = true;
    }

    db.amenityRecords.push({ id: generateId(db.amenityRecords), userId: u.id, bookingId: b.id, providerId: db.currentUser.id, desc: d, amount: am, date: todayStr(), isPaid: isPaid });
    saveDB(); 
    alert(isPaid ? 'هزینه از کیف پول کسر و ثبت شد.' : 'موجودی کافی نبود. مبلغ در بدهی اتاق ثبت شد.'); 
    document.getElementById('a-code').value=''; document.getElementById('a-room').value=''; document.getElementById('a-desc').value=''; document.getElementById('a-amount').value='';
};
