export const formatPhoneForCognito = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Add +1 prefix if not present
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
};
