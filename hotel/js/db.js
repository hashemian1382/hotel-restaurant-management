const DB_KEY = 'hotelDB4';

let db = { users: [], rooms: [], bookings: [], restaurantOrders: [], parkingRecords: [], parkingTariffs: [], amenityRecords: [], transactions: [], currentUser: null };

function initDB() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
        db = JSON.parse(stored);
    } else {
        db.users.push(
            { id: 1, userCode: '100001', user: 'admin', pass: 'admin', role: 'manager', name: 'مدیر کل', phone: '09120000000', wallet: 0 },
            { id: 2, userCode: '100002', user: 'rec', pass: 'rec', role: 'reception', name: 'مسئول پذیرش', phone: '09121111111', wallet: 0 },
            { id: 3, userCode: '100003', user: 'serv', pass: 'serv', role: 'service', name: 'مسئول خدمات', phone: '09122222222', wallet: 0 },
            { id: 4, userCode: '100004', user: 'guest', pass: 'guest', role: 'guest', name: 'مهمان تستی', phone: '09123333333', wallet: 0 },
            { id: 5, userCode: '100005', user: 'rest', pass: 'rest', role: 'restaurant', name: 'کاربر رستوران', phone: '', wallet: 0 },
            { id: 6, userCode: '100006', user: 'park', pass: 'park', role: 'parking', name: 'کاربر پارکینگ', phone: '', wallet: 0 },
            { id: 7, userCode: '100007', user: 'am1', pass: 'am1', role: 'amenity', name: 'استخر', phone: '', wallet: 0 },
            { id: 8, userCode: '100008', user: 'am2', pass: 'am2', role: 'amenity', name: 'ماساژ', phone: '', wallet: 0 },
            { id: 9, userCode: '100009', user: 'am3', pass: 'am3', role: 'amenity', name: 'باشگاه', phone: '', wallet: 0 }
        );
        db.parkingTariffs.push({ id: 1, name: 'تعرفه عادی', hours: 1, price: 20000 });
        const types = ['یک تخته', 'دو تخته', 'سوئیت'];
        const prices = [1000000, 1800000, 3500000];
        const caps = [1, 2, 4];
        let roomId = 1;
        for (let floor = 1; floor <= 3; floor++) {
            for (let i = 1; i <= 5; i++) {
                let typeIdx = i > 3 ? (i === 5 ? 2 : 1) : 0;
                db.rooms.push({
                    id: roomId++, number: `${floor}0${i}`, floor: floor, type: types[typeIdx], capacity: caps[typeIdx], price: prices[typeIdx], status: 'available', amenities: 'وای‌فای، تلویزیون، مینی‌بار'
                });
            }
        }
        saveDB();
    }
}

function saveDB() { 
    localStorage.setItem(DB_KEY, JSON.stringify(db)); 
}

function generateId(arr) { 
    return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1; 
}

function generateUserCode() {
    let code;
    do { 
        code = Math.floor(100000 + Math.random() * 900000).toString(); 
    } while(db.users.some(u => u.userCode === code));
    return code;
}

window.parseJalali = function(str) {
    const p = str.split('/');
    if(p.length !== 3) return new Date();
    const g = jalaali.toGregorian(parseInt(p[0]), parseInt(p[1]), parseInt(p[2]));
    return new Date(g.gy, g.gm - 1, g.gd);
};

const todayStr = () => {
    const d = new Date();
    const j = jalaali.toJalaali(d);
    const m = j.jm < 10 ? '0' + j.jm : j.jm;
    const dy = j.jd < 10 ? '0' + j.jd : j.jd;
    return `${j.jy}/${m}/${dy}`;
};

const nowStr = () => {
    const d = new Date();
    const time = d.toTimeString().split(' ')[0];
    return todayStr() + ' ' + time;
};

window.autoSettleDebts = function(userId) {
    const u = db.users.find(x => x.id === userId);
    if (!u || u.wallet <= 0) return;
    const activeBookings = db.bookings.filter(b => b.guestId === userId && b.status === 'active');
    activeBookings.forEach(b => {
        db.restaurantOrders.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => {
            if(u.wallet >= x.amount) {
                u.wallet -= x.amount; x.isPaid = true;
                db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -x.amount, type: 'کسر', desc: 'تسویه خودکار بدهی رستوران', method: 'سیستم', date: nowStr() });
            }
        });
        db.parkingRecords.filter(x => x.bookingId === b.id && !x.isPaid && x.cost).forEach(x => {
            if(u.wallet >= x.cost) {
                u.wallet -= x.cost; x.isPaid = true;
                db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -x.cost, type: 'کسر', desc: 'تسویه خودکار بدهی پارکینگ', method: 'سیستم', date: nowStr() });
            }
        });
        db.amenityRecords.filter(x => x.bookingId === b.id && !x.isPaid).forEach(x => {
            if(u.wallet >= x.amount) {
                u.wallet -= x.amount; x.isPaid = true;
                db.transactions.push({ id: generateId(db.transactions), userId: u.id, amount: -x.amount, type: 'کسر', desc: 'تسویه خودکار بدهی امکانات رفاهی', method: 'سیستم', date: nowStr() });
            }
        });
    });
    saveDB();
};

initDB();
