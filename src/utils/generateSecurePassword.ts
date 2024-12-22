import { randomInt } from 'node:crypto';

export function generateSecurePassword(): string {
  // Define character sets
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  // Ensure we have one of each required character type
  const password = [
    lowercase[randomInt(lowercase.length)],
    uppercase[randomInt(uppercase.length)],
    numbers[randomInt(numbers.length)],
    special[randomInt(special.length)],
  ];

  // Add 8 more random characters (total length 12)
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password.push(allChars[randomInt(allChars.length)]);
  }

  // Shuffle array using Fisher-Yates
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
