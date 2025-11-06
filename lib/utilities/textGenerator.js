export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);

  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
};
