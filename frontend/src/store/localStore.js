// ============================================================
// Katha Book - Local Storage Data Store
// No backend needed - everything stored in browser
// ============================================================

const KEYS = {
  SHOP:     'kb_shop',
  CUSTOMERS:'kb_customers',
  BILLS:    'kb_bills',
};

// ---- Helpers ------------------------------------------------
const load  = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const save  = (key, d) => localStorage.setItem(key, JSON.stringify(d));
const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---- Shop Profile -------------------------------------------
export const getShop = () => {
  try { const s = localStorage.getItem(KEYS.SHOP); return s ? JSON.parse(s) : null; }
  catch { return null; }
};
export const saveShop = (data) => localStorage.setItem(KEYS.SHOP, JSON.stringify(data));

// ---- Customers ----------------------------------------------
export const getCustomers = () => load(KEYS.CUSTOMERS);

export const addCustomer = (c) => {
  const list = getCustomers();
  const item = { ...c, id: uid(), createdAt: new Date().toISOString() };
  save(KEYS.CUSTOMERS, [item, ...list]);
  return item;
};

export const updateCustomer = (id, updates) => {
  save(KEYS.CUSTOMERS, getCustomers().map(c => c.id === id ? { ...c, ...updates } : c));
};

export const deleteCustomer = (id) => {
  save(KEYS.CUSTOMERS, getCustomers().filter(c => c.id !== id));
  save(KEYS.BILLS,     getBills().filter(b => b.customerId !== id));
};

// ---- Bills --------------------------------------------------
export const getBills = () => load(KEYS.BILLS);
export const getCustomerBills = (customerId) => getBills().filter(b => b.customerId === customerId);

export const addBill = (bill) => {
  const list = getBills();
  const num  = `KB-${String(list.length + 1).padStart(4, '0')}`;
  const item = {
    ...bill,
    id: uid(),
    billNumber: num,
    createdAt: new Date().toISOString(),
    payments: bill.paidAmount > 0
      ? [{ id: uid(), amount: bill.paidAmount, method: 'cash', date: new Date().toISOString(), note: 'Initial payment' }]
      : [],
    status: bill.dueAmount <= 0 ? 'paid' : 'pending',
  };
  save(KEYS.BILLS, [item, ...list]);
  return item;
};

export const addPaymentToBill = (billId, { amount, method = 'cash', note = '' }) => {
  const amt = Number(amount);
  save(KEYS.BILLS, getBills().map(b => {
    if (b.id !== billId) return b;
    const newPaid  = b.paidAmount + amt;
    const newDue   = Math.max(0, b.dueAmount - amt);
    const status   = newDue <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
    const payment  = { id: uid(), amount: amt, method, date: new Date().toISOString(), note };
    return { ...b, paidAmount: newPaid, dueAmount: newDue, status, payments: [...(b.payments || []), payment] };
  }));
};

export const markFullyPaid = (billId) => {
  save(KEYS.BILLS, getBills().map(b => {
    if (b.id !== billId) return b;
    const payment = { id: uid(), amount: b.dueAmount, method: 'cash', date: new Date().toISOString(), note: 'Marked as paid' };
    return { ...b, paidAmount: b.totalAmount, dueAmount: 0, status: 'paid', payments: [...(b.payments || []), payment] };
  }));
};

export const deleteBill = (id) => save(KEYS.BILLS, getBills().filter(b => b.id !== id));

// ---- Dashboard Stats ----------------------------------------
export const getDashboardStats = () => {
  const bills     = getBills();
  const customers = getCustomers();
  const now       = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd    = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalSales = 0, totalPending = 0, overdueCount = 0, dueTodayCount = 0,
      dueTomorrowCount = 0, todayCollection = 0, monthCollection = 0;

  bills.forEach(b => {
    totalSales += b.totalAmount || 0;
    if (b.dueAmount > 0) {
      totalPending += b.dueAmount;
      const due = new Date(b.dueDate);
      if (due < todayStart)           overdueCount++;
      else if (due < todayEnd)        dueTodayCount++;
      else if (due < tomorrowEnd)     dueTomorrowCount++;
    }
    (b.payments || []).forEach(p => {
      const pd = new Date(p.date);
      if (pd >= todayStart && pd < todayEnd) todayCollection += p.amount;
      if (pd >= monthStart)                  monthCollection += p.amount;
    });
  });

  // 6-month chart data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const mb    = bills.filter(b => new Date(b.createdAt) >= start && new Date(b.createdAt) < end);
    monthlyData.push({
      month:     start.toLocaleString('default', { month: 'short' }),
      Sales:     mb.reduce((s, b) => s + b.totalAmount, 0),
      Collected: mb.reduce((s, b) => s + b.paidAmount, 0),
      Due:       mb.reduce((s, b) => s + b.dueAmount, 0),
    });
  }

  return {
    totalCustomers: customers.length,
    totalBills: bills.length,
    totalSales, totalPending,
    overdueCount, dueTodayCount, dueTomorrowCount,
    todayCollection, monthCollection,
    monthlyData,
  };
};

export const getPendingAlerts = () => {
  const bills     = getBills();
  const customers = getCustomers();
  const now       = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd    = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);
  const custMap   = Object.fromEntries(customers.map(c => [c.id, c]));

  return bills
    .filter(b => b.dueAmount > 0)
    .map(b => {
      const due  = new Date(b.dueDate);
      const daysOverdue = due < todayStart ? Math.floor((todayStart - due) / 86400000) : 0;
      const penalty = daysOverdue * (b.penaltyPerDay || 0);
      let alertType = 'upcoming';
      if (due < todayStart)       alertType = 'overdue';
      else if (due < todayEnd)    alertType = 'today';
      else if (due < tomorrowEnd) alertType = 'tomorrow';
      return { ...b, customer: custMap[b.customerId], daysOverdue, penalty, alertType };
    })
    .sort((a, b) => {
      const order = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 };
      return order[a.alertType] - order[b.alertType];
    });
};

// ---- Seed sample data (first run) ---------------------------
export const seedSampleData = () => {
  if (getCustomers().length > 0) return; // already seeded

  // Sample customers
  const customers = [
    { name: 'Ramesh Sharma',  phone: '9876543210', shopName: 'Sharma Kirana',   address: 'Main Bazar, Delhi' },
    { name: 'Suresh Patel',   phone: '9123456780', shopName: 'Patel Store',     address: 'Gandhi Road, Surat' },
    { name: 'Anita Devi',     phone: '9988776655', shopName: 'Anita Textiles',  address: 'Market Street, Jaipur' },
    { name: 'Mohan Yadav',    phone: '9012345678', shopName: 'Yadav Traders',   address: 'Station Road, Patna' },
  ];
  const [c1, c2, c3, c4] = customers.map(c => addCustomer(c));

  // Sample bills with various due dates
  const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
  const daysLater= (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

  addBill({ customerId: c1.id, items: [{ name: 'Rice 25kg', qty: 2, price: 1800, subtotal: 3600 }, { name: 'Dal 5kg', qty: 3, price: 450, subtotal: 1350 }], totalAmount: 4950, paidAmount: 2000, dueAmount: 2950, dueDate: daysAgo(5),  creditDays: 30, penaltyPerDay: 10, notes: '' });
  addBill({ customerId: c2.id, items: [{ name: 'Sugar 50kg', qty: 1, price: 2200, subtotal: 2200 }, { name: 'Oil 5L',   qty: 2, price: 650, subtotal: 1300 }], totalAmount: 3500, paidAmount: 0,    dueAmount: 3500, dueDate: new Date().toISOString(), creditDays: 15, penaltyPerDay: 10, notes: '' });
  addBill({ customerId: c3.id, items: [{ name: 'Wheat Flour 10kg', qty: 5, price: 380, subtotal: 1900 }], totalAmount: 1900, paidAmount: 500, dueAmount: 1400, dueDate: daysLater(1), creditDays: 7, penaltyPerDay: 5, notes: '' });
  addBill({ customerId: c4.id, items: [{ name: 'Biscuits Carton', qty: 3, price: 900, subtotal: 2700 }, { name: 'Tea 1kg', qty: 4, price: 350, subtotal: 1400 }], totalAmount: 4100, paidAmount: 4100, dueAmount: 0, dueDate: daysLater(20), creditDays: 30, penaltyPerDay: 10, notes: '' });
  addBill({ customerId: c1.id, items: [{ name: 'Salt 5kg', qty: 10, price: 50, subtotal: 500 }, { name: 'Spices', qty: 5, price: 200, subtotal: 1000 }], totalAmount: 1500, paidAmount: 0, dueAmount: 1500, dueDate: daysLater(10), creditDays: 15, penaltyPerDay: 5, notes: '' });
};
