import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key';

export function encrypt(text: string): { content: string; iv: string } {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    content: encrypted.toString(),
    iv: iv.toString(),
  };
}

export function decrypt(encryptedText: string, iv: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
  const hash = CryptoJS.PBKDF2(password, useSalt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();

  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = hashPassword(password, salt).hash;
  return verifyHash === hash;
}