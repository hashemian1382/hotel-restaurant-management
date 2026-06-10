function restDash(container) {
    let ordersHtml = ``;
    if(db.restaurantOrders.length === 0) {
        ordersHtml = `<p style="text-align:center; color:#777;">هیچ سفارشی ثبت نشده است.</p>`;
    } else {
        ordersHtml = `
            <table style="width:100%; border-collapse: collapse; margin-top:15px;">
                <thead>
                    <tr style="background:#f5f5f5;">
                        <th style="padding:10px; border-bottom:1px solid #ddd;">تاریخ</th>
                        <th style="padding:10px; border-bottom:1px solid #ddd;">نام مهمان</th>
                        <th style="padding:10px; border-bottom:1px solid #ddd;">شماره اتاق</th>
                        <th style="padding:10px; border-bottom:1px solid #ddd;">مبلغ (تومان)</th>
                        <th style="padding:10px; border-bottom:1px solid #ddd;">وضعیت پرداخت</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        [...db.restaurantOrders].reverse().forEach(o => {
            const u = db.users.find(x => x.id === o.userId);
            const b = db.bookings.find(x => x.id === o.bookingId);
            const r = b ? db.rooms.find(x => x.id === b.roomId) : null;
            
            ordersHtml += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px; text-align:center;">${o.date}</td>
                    <td style="padding:10px; text-align:center;">${u ? u.name : 'نامشخص'}</td>
                    <td style="padding:10px; text-align:center;">${r ? r.number : 'نامشخص'}</td>
                    <td style="padding:10px; text-align:center;">${o.amount.toLocaleString()}</td>
                    <td style="padding:10px; text-align:center;">
                        <span style="padding:3px 8px; border-radius:12px; font-size:12px; ${o.isPaid ? 'background:#e6f4ea; color:#1e8e3e;' : 'background:#fce8e6; color:#d93025;'}">
                            ${o.isPaid ? 'پرداخت شده' : 'ثبت در بدهی'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        ordersHtml += `</tbody></table>`;
    }

    container.innerHTML = `
        <div class="card" style="margin-bottom:20px; text-align:center; padding: 30px;">
            <h2>سیستم مدیریت یکپارچه رستوران</h2>
            <p style="color:#666; margin-bottom: 20px;">برای مدیریت منو، گارسون‌ها، آشپزخانه و ثبت سفارشات وارد سیستم مجزای رستوران شوید.</p>
            <a href="../Restaurant/index.html" target="_blank" style="display:inline-block; background:#4f46e5; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
                ورود به سامانه رستوران
            </a>
        </div>
        
        <div class="card">
            <h3>تاریخچه سفارشات رستوران مهمانان هتل</h3>
            ${ordersHtml}
        </div>
    `;
}
