import { Cipher } from '../interfaces/cipher.js';
import aesjs from 'aes-js';
import sha256 from 'sha.js';

export class AES implements Cipher {
  private generateIV(): Uint8Array {
    return aesjs.utils.hex.toBytes('000102030405060708090a0b0c0d0e0f'); // Fixed IV
  }

  encrypt(
    plaintext: string,
    key: Uint8Array,
  ): { ciphertext: Uint8Array; mac: string } {
    const iv = this.generateIV();
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const paddedPlaintext = this.pad(plaintext);
    const ciphertext = aesCbc.encrypt(
      aesjs.utils.utf8.toBytes(paddedPlaintext),
    );
    const mac = this.hmac(ciphertext, key);
    return { ciphertext, mac };
  }

  decrypt(ciphertext: Uint8Array, mac: string, key: Uint8Array): string {
    if (this.hmac(ciphertext, key) !== mac) {
      throw new Error('MAC verification failed');
    }
    const iv = this.generateIV();
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const decryptedBytes = aesCbc.decrypt(ciphertext);
    return this.unpad(aesjs.utils.utf8.fromBytes(decryptedBytes));
  }

  private hmac(data: Uint8Array, key: Uint8Array): string {
    const combined = new Uint8Array([...key, ...data]);
    return sha256('SHA256').update(combined).digest('hex');
  }

  private pad(text: string): string {
    const blockSize = 16;
    const padSize = blockSize - (text.length % blockSize);
    return text + String.fromCharCode(padSize).repeat(padSize);
  }

  private unpad(text: string): string {
    const padSize = text.charCodeAt(text.length - 1);
    return text.slice(0, -padSize);
  }
}
