function mgrDash(container) {
    const guests = db.bookings.filter(b => b.status === 'active').length;
    const avail = db.rooms.filter(r => r.status === 'available').length;
    let html = `
        <div class="grid-4" style="margin-bottom: 2rem;">
            <div class="stat-card"><h3>${guests}</h3><p>مهمانان حاضر</p></div>
            <div class="stat-card"><h3>${avail}</h3><p>اتاق‌های خالی</p></div>
            <div class="stat-card"><h3>${db.rooms.filter(r => r.status === 'dirty').length}</h3><p>نیازمند نظافت</p></div>
            <div class="stat-card"><h3>${db.rooms.filter(r => r.status === 'maintenance').length}</h3><p>نیازمند تعمیر</p></div>
        </div>
        <div class="card"><h3>وضعیت کل اتاق‌ها</h3><div class="grid-4">
    `;
    db.rooms.forEach(r => html += `<div style="border:1px solid var(--border); padding:1rem; border-radius:8px; text-align:center;"><h4 style="margin-bottom:0.5rem">اتاق ${r.number}</h4>${getStatusBadge(r.status)}<p style="font-size:0.8rem; margin-top:0.5rem; color:var(--gray)">${r.type}</p></div>`);
    container.innerHTML = html + `</div></div>`;
}

function mgrRooms(container) {
    let html = `<div class="card"><button onclick="editRoom(null)" style="width:auto; margin-bottom:1rem;">+ اتاق جدید</button><table><tr><th>شماره</th><th>طبقه</th><th>نوع</th><th>ظرفیت</th><th>قیمت (تومان)</th><th>عملیات</th></tr>`;
    db.rooms.forEach(r => html += `<tr><td>${r.number}</td><td>${r.floor}</td><td>${r.type}</td><td>${r.capacity}</td><td>${r.price.toLocaleString()}</td><td><button class="outline" style="padding:0.25rem 0.5rem; font-size:0.8rem" onclick="editRoom(${r.id})">ویرایش</button></td></tr>`);
    container.innerHTML = html + `</table></div>`;
}

window.editRoom = function(rId) {
    const r = rId ? db.rooms.find(x => x.id === rId) : { number: '', floor: 1, type: 'یک تخته', capacity: 1, price: 1000000, amenities: '' };
    openModal(rId ? 'ویرایش اتاق' : 'اتاق جدید', `
        <div class="form-group"><label>شماره اتاق</label><input type="text" id="er-num" value="${r.number}"></div>
        <div class="form-group"><label>طبقه</label><input type="number" id="er-floor" value="${r.floor}"></div>
        <div class="form-group"><label>نوع</label><input type="text" id="er-type" value="${r.type}"></div>
        <div class="form-group"><label>ظرفیت</label><input type="number" id="er-cap" value="${r.capacity}"></div>
        <div class="form-group"><label>قیمت</label><input type="number" id="er-price" value="${r.price}"></div>
        <div class="form-group"><label>امکانات</label><input type="text" id="er-am" value="${r.amenities}"></div>
        <button onclick="saveRoom(${rId || 0})">ذخیره</button>
    `);
};

window.saveRoom = function(rId) {
    const rData = { number: document.getElementById('er-num').value, floor: parseInt(document.getElementById('er-floor').value), type: document.getElementById('er-type').value, capacity: parseInt(document.getElementById('er-cap').value), price: parseInt(document.getElementById('er-price').value), amenities: document.getElementById('er-am').value };
    if(rId) Object.assign(db.rooms.find(x => x.id === rId), rData);
    else db.rooms.push({ id: generateId(db.rooms), status: 'available', ...rData });
    saveDB(); closeModal(); mgrRooms(document.getElementById('dynamic-content'));
};

function mgrUsers(container) {
    const roles = { manager: 'مدیر', reception: 'پذیرش', service: 'خدمات', guest: 'مهمان', restaurant: 'رستوران', parking: 'پارکینگ', amenity: 'امکانات رفاهی' };
    let html = `<div class="card"><button onclick="editUser(null)" style="width:auto; margin-bottom:1rem;">+ کاربر جدید</button><table><tr><th>نام</th><th>نام کاربری ورود</th><th>کد کاربری یکتا</th><th>تلفن</th><th>دسترسی</th><th>عملیات</th></tr>`;
    db.users.forEach(u => html += `<tr><td>${u.name}</td><td>${u.user}</td><td><span class="badge" style="background:#f1f5f9; color:#0f172a">${u.userCode || 'ندارد'}</span></td><td>${u.phone || '-'}</td><td>${roles[u.role] || u.role}</td><td><button class="outline" style="padding:0.25rem 0.5rem; font-size:0.8rem" onclick="editUser(${u.id})">ویرایش</button></td></tr>`);
    container.innerHTML = html + `</table></div>`;
}

window.editUser = function(uId) {
    const u = uId ? db.users.find(x => x.id === uId) : { name: '', user: '', pass: '', phone: '', role: 'reception' };
    openModal(uId ? 'ویرایش کاربر' : 'کاربر جدید', `
        <div class="form-group"><label>نام کامل</label><input type="text" id="eu-name" value="${u.name}"></div>
        <div class="form-group"><label>نام کاربری جهت ورود (انگلیسی)</label><input type="text" id="eu-user" value="${u.user}"></div>
        <div class="form-group"><label>رمز عبور</label><input type="text" id="eu-pass" value="${u.pass}"></div>
        <div class="form-group"><label>تلفن</label><input type="text" id="eu-phone" value="${u.phone}"></div>
        <div class="form-group"><label>دسترسی / نقش</label>
            <select id="eu-role">
                <option value="manager" ${u.role==='manager'?'selected':''}>مدیر</option>
                <option value="reception" ${u.role==='reception'?'selected':''}>پذیرش</option>
                <option value="service" ${u.role==='service'?'selected':''}>خدمات</option>
                <option value="guest" ${u.role==='guest'?'selected':''}>مهمان</option>
                <option value="restaurant" ${u.role==='restaurant'?'selected':''}>رستوران</option>
                <option value="parking" ${u.role==='parking'?'selected':''}>پارکینگ</option>
                <option value="amenity" ${u.role==='amenity'?'selected':''}>امکانات رفاهی</option>
            </select>
        </div><button onclick="saveUser(${uId || 0})">ذخیره کاربر</button>
    `);
};

window.saveUser = function(uId) {
    const un = document.getElementById('eu-user').value;
    const uData = { name: document.getElementById('eu-name').value, user: un, pass: document.getElementById('eu-pass').value, phone: document.getElementById('eu-phone').value, role: document.getElementById('eu-role').value };
    if(uId) Object.assign(db.users.find(x => x.id === uId), uData);
    else { 
        if(db.users.some(x => x.user === un)) return alert('نام کاربری تکراری است.'); 
        const code = generateUserCode();
        db.users.push({ id: generateId(db.users), userCode: code, ...uData }); 
        alert(`کاربر جدید با موفقیت ساخته شد.\nکد کاربری یکتا: ${code}`);
    }
    saveDB(); closeModal(); mgrUsers(document.getElementById('dynamic-content'));
};
