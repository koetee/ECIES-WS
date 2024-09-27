import { Cipher } from './interfaces/cipher.js';
import { KDF } from './interfaces/kdf.js';
import { EllipticCurve } from './ec/ellipticCurve.js';
import { KeyPair } from './interfaces/keyPair.js';

export class ECIES {
  private curve: EllipticCurve;
  private cipher: Cipher;
  private kdf: KDF;

  constructor(curve: EllipticCurve, cipher: Cipher, kdf: KDF) {
    this.curve = curve;
    this.cipher = cipher;
    this.kdf = kdf;
  }

  generateKeyPair(): KeyPair {
    return this.curve.generateKeyPair();
  }

  encrypt(
    plaintext: string,
    receiverPublicKey: string,
  ): { ciphertext: Uint8Array; mac: string; ephemeralPublicKey: string } {
    const ephemeralKeyPair = this.curve.generateKeyPair();
    const sharedSecret = this.curve.deriveSharedSecret(
      ephemeralKeyPair.privateKey,
      receiverPublicKey,
    );
    const symmetricKey = this.kdf.deriveKey(sharedSecret);
    const { ciphertext, mac } = this.cipher.encrypt(plaintext, symmetricKey);
    return { ciphertext, mac, ephemeralPublicKey: ephemeralKeyPair.publicKey };
  }

  decrypt(
    ciphertext: Uint8Array,
    mac: string,
    ephemeralPublicKey: string,
    privateKey: string,
  ): string {
    const sharedSecret = this.curve.deriveSharedSecret(
      privateKey,
      ephemeralPublicKey,
    );
    const symmetricKey = this.kdf.deriveKey(sharedSecret);
    return this.cipher.decrypt(ciphertext, mac, symmetricKey);
  }
}
