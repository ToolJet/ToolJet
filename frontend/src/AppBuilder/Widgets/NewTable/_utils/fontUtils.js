// Font utility for converting TTF to base64 for jsPDF

// Arabic text detection
export const containsArabic = (text) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

// Check if any data contains Arabic text
export const dataContainsArabic = (headers, data) => {
  // Check headers
  const headersHaveArabic = headers.some((header) => containsArabic(String(header)));
  if (headersHaveArabic) return true;

  // Check data
  return data.some((row) => row.some((cell) => containsArabic(String(cell))));
};
