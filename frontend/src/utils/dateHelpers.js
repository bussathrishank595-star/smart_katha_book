// Format currency in Indian Rupee format
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(amount || 0);

// Format date to locale string
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

// Calculate due date from credit days
export const calcDueDate = (creditDays) => {
  const d = new Date();
  d.setDate(d.getDate() + (creditDays || 30));
  return d;
};

// Check if a date is overdue
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date() > new Date(dueDate);
};

// Days until due (negative if overdue)
export const daysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Calculate accrued penalty
export const calcPenalty = (bill) => {
  if (!bill || bill.dueAmount <= 0) return 0;
  const now = new Date();
  const due = new Date(bill.dueDate);
  if (now <= due) return 0;
  const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return days * (bill.penaltyPerDay || 10);
};

// Get status label and color class
export const getStatusInfo = (status) => {
  switch (status) {
    case 'paid':    return { label: 'Paid',    badge: 'badge-paid',    dot: 'bg-emerald-500' };
    case 'overdue': return { label: 'Overdue', badge: 'badge-overdue', dot: 'bg-red-500' };
    case 'partial': return { label: 'Partial', badge: 'badge-partial', dot: 'bg-violet-500' };
    default:        return { label: 'Pending', badge: 'badge-pending', dot: 'bg-amber-500' };
  }
};

// Relative time (e.g. "3 days ago", "in 5 days")
export const relativeTime = (date) => {
  const days = daysUntilDue(date);
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
};
