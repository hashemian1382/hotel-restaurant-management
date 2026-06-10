function servTasks(container) {
    const tasks = db.rooms.filter(r => r.status === 'dirty' || r.status === 'maintenance');
    let html = `<div class="grid-2"><div class="card"><h3>وظایف روزانه</h3><table><tr><th>اتاق</th><th>وضعیت</th><th>عملیات</th></tr>`;
    tasks.forEach(r => html += `<tr><td>${r.number}</td><td>${getStatusBadge(r.status)}</td><td><button class="secondary" style="padding:0.25rem; font-size:0.8rem" onclick="changeRStatus(${r.id}, 'available')">آماده شد</button></td></tr>`);
    html += `</table></div><div class="card"><h3>گزارش خرابی</h3><table><tr><th>شماره اتاق</th><th>وضعیت</th><th>عملیات</th></tr>`;
    db.rooms.forEach(r => html += `<tr><td>${r.number}</td><td>${getStatusBadge(r.status)}</td><td>${r.status!=='maintenance' ? `<button class="warning" style="padding:0.25rem; font-size:0.8rem" onclick="changeRStatus(${r.id}, 'maintenance')">خرابی</button>` : '-'}</td></tr>`);
    container.innerHTML = html + `</table></div></div>`;
}

window.changeRStatus = function(rId, s) {
    db.rooms.find(x => x.id === rId).status = s; saveDB();
    if(currentView === 'servTasks') servTasks(document.getElementById('dynamic-content'));
    else if(currentView === 'mgrDash') mgrDash(document.getElementById('dynamic-content'));
};
