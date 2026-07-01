// Build an SMS URI using the device's native SMS app
export const buildSmsUri = (phone, message) => {
  // Normalize phone number (remove spaces, dashes)
  const normalized = phone.replace(/[\s\-\(\)]/g, '');
  const withCountry = normalized.startsWith('+') ? normalized : `+91${normalized}`;
  const encoded = encodeURIComponent(message);
  return `sms:${withCountry}?body=${encoded}`;
};

// Open the SMS app with a pre-filled message
export const sendSmsReminder = ({ customerName, phone, dueAmount, dueDate, shopName }) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const message = `Dear ${customerName}, your pending amount of ₹${dueAmount.toLocaleString('en-IN')} at ${shopName} is due on ${formattedDate}. Please pay at your earliest convenience. Thank you.`;
  const uri = buildSmsUri(phone, message);
  window.location.href = uri;
};
