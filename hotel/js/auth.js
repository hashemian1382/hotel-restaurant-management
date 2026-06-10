let isLoginMode = true;

window.onload = () => {
    if (db.currentUser) window.location.href = 'dashboard.html';
};

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('register-fields').className = isLoginMode ? 'hidden' : '';
    document.getElementById('auth-title').innerText = isLoginMode ? 'ورود به سامانه' : 'ثبت نام مهمان';
    document.getElementById('auth-btn').innerText = isLoginMode ? 'ورود' : 'ثبت نام';
    document.querySelector('#auth-form p a').innerText = isLoginMode ? 'ثبت نام مهمان جدید' : 'بازگشت به ورود';
}

function handleAuth(event) {
    event.preventDefault();
    
    const u = document.getElementById('auth-user').value;
    const p = document.getElementById('auth-pass').value;
    
    if (isLoginMode) {
        const user = db.users.find(x => x.user === u && x.pass === p);
        if (user) {
            db.currentUser = user;
            saveDB();
            window.location.href = 'dashboard.html';
        } else {
            alert('نام کاربری یا رمز عبور اشتباه است.');
        }
    } else {
        const n = document.getElementById('reg-name').value;
        const ph = document.getElementById('reg-phone').value;
        if (db.users.some(x => x.user === u)) return alert('نام کاربری تکراری است.');
        const newUser = { id: generateId(db.users), userCode: generateUserCode(), user: u, pass: p, role: 'guest', name: n, phone: ph, wallet: 0 };
        db.users.push(newUser);
        db.currentUser = newUser;
        saveDB();
        window.location.href = 'dashboard.html';
    }
}
