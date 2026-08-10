/**
 * Generates a 6-character user ID: 3 lowercase letters + 3 digits.
 * Example: "qwe125", "abc789", "xyz001"
 */
export function generateUserId() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  let id = '';
  for (let i = 0; i < 3; i++) {
    id += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    id += digits[Math.floor(Math.random() * digits.length)];
  }
  return id;
}

/**
 * Generates a 6-character alphanumeric room code.
 * Example: "a3b2c1", "x9y8z7"
 */
export function generateRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validates that a string matches the user ID format: 3 lowercase letters + 3 digits.
 */
export function isValidUserId(id) {
  return typeof id === 'string' && /^[a-z]{3}[0-9]{3}$/.test(id);
}

/**
 * Validates that a string matches the room code format: 6 alphanumeric characters.
 */
export function isValidRoomCode(code) {
  return typeof code === 'string' && /^[a-z0-9]{6}$/.test(code);
}
