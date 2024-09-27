import { describe, it, expect, beforeEach } from 'vitest';
import {
  ECIES,
  Secp256k1Curve,
  AES,
  SHA256Kdf,
  KeyPair,
  Cipher,
  KDF,
  EllipticCurve,
} from '../../modules/ecies/index.js';

describe('ECIES Encryption and Decryption', () => {
  let ecies: ECIES;
  let keyPair: KeyPair;
  let curve: EllipticCurve;
  let cipher: Cipher;
  let kdf: KDF;

  beforeEach(() => {
    curve = new Secp256k1Curve();
    cipher = new AES();
    kdf = new SHA256Kdf();

    ecies = new ECIES(curve, cipher, kdf);

    keyPair = ecies.generateKeyPair();
  });

  it('should generate valid key pairs', () => {
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('should correctly encrypt and decrypt a message', () => {
    const message = 'Hello, ECIES!';

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    expect(encryptionResult.ciphertext).toBeDefined();
    expect(encryptionResult.mac).toBeDefined();
    expect(encryptionResult.ephemeralPublicKey).toBeDefined();

    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message);
  });

  it('should correctly handle an empty message', () => {
    const message = '';

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message);
  });

  it('should correctly encrypt and decrypt a large message', () => {
    const length = 4096; // 4096 байт (32768 бит)
    const randomBytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 64);
    }

    const message = Array.from(randomBytes)
      .map((byte) => String.fromCharCode(byte))
      .join('');

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message);
  });

  it('should correctly encrypt and decrypt multiple distinct messages', () => {
    const messages = ['First Message', 'Second Message', 'Third Message'];
    const encryptionResults = messages.map((msg) =>
      ecies.encrypt(msg, keyPair.publicKey),
    );

    const decryptedMessages = encryptionResults.map((result) =>
      ecies.decrypt(
        result.ciphertext,
        result.mac,
        result.ephemeralPublicKey,
        keyPair.privateKey,
      ),
    );

    expect(decryptedMessages).toEqual(messages);
  });

  it('should fail MAC verification for tampered ciphertext', () => {
    const message = 'Test message';

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    encryptionResult.ciphertext[0] ^= 1;

    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        keyPair.privateKey,
      );
    }).toThrow('MAC verification failed');
  });

  it('should fail decryption with an incorrect private key', () => {
    const message = 'Hello, ECIES!';
    const wrongKeyPair = ecies.generateKeyPair();

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        wrongKeyPair.privateKey,
      );
    }).toThrow();
  });

  it('should fail encryption with an invalid public key', () => {
    const message = 'Test with invalid public key';
    const invalidPublicKey = '1234';

    expect(() => {
      ecies.encrypt(message, invalidPublicKey);
    }).toThrow();
  });

  it('should fail decryption with tampered ephemeral public key', () => {
    const message = 'Test message';

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    const tamperedEphemeralKey =
      encryptionResult.ephemeralPublicKey.slice(0, -2) + '00';

    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        tamperedEphemeralKey,
        keyPair.privateKey,
      );
    }).toThrow();
  });

  it('should fail decryption with a truncated ciphertext', () => {
    const message = 'Test message';

    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    const truncatedCiphertext = encryptionResult.ciphertext.slice(0, -5);

    expect(() => {
      ecies.decrypt(
        truncatedCiphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        keyPair.privateKey,
      );
    }).toThrow();
  });

  it('should produce different ciphertexts for the same message with different ephemeral keys', () => {
    const message = 'Repeated message';

    const encryptionResult1 = ecies.encrypt(message, keyPair.publicKey);
    const encryptionResult2 = ecies.encrypt(message, keyPair.publicKey);

    expect(encryptionResult1.ciphertext).not.toEqual(
      encryptionResult2.ciphertext,
    );
    expect(encryptionResult1.ephemeralPublicKey).not.toEqual(
      encryptionResult2.ephemeralPublicKey,
    );

    const decryptedMessage1 = ecies.decrypt(
      encryptionResult1.ciphertext,
      encryptionResult1.mac,
      encryptionResult1.ephemeralPublicKey,
      keyPair.privateKey,
    );
    const decryptedMessage2 = ecies.decrypt(
      encryptionResult2.ciphertext,
      encryptionResult2.mac,
      encryptionResult2.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage1).toEqual(message);
    expect(decryptedMessage2).toEqual(message);
  });
});
