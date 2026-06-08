const generateCreditCard = () => {
  const cardTypes = ['Visa', 'Mastercard', 'Amex'];
  const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
  const cardNumber = Math.floor(Math.random() * 9000000000000000) + 1000000000000000;
  const expiryMonth = Math.floor(Math.random() * 12) + 1;
  const expiryYear = Math.floor(Math.random() * 10) + 2024;
  const cvv = Math.floor(Math.random() * 1000);
  return {
    cardType,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv
  };
};

module.exports = generateCreditCard;