import { describe, it, expect, beforeEach } from 'vitest';
import { ECIES } from '../../modules/ecies/index.js'; // Убедитесь, что путь правильный

describe('ECIES Encryption and Decryption', () => {
  let ecies: ECIES;
  let keyPair: { publicKey: string; privateKey: string };

  // Initialize before each test
  beforeEach(() => {
    ecies = new ECIES();
    keyPair = ecies.generateKeyPair();
  });

  it('should generate valid key pairs', () => {
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('should correctly encrypt and decrypt a message', () => {
    const message = 'Hello, ECIES!';

    // Encrypt the message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    expect(encryptionResult.ciphertext).toBeDefined();
    expect(encryptionResult.mac).toBeDefined();
    expect(encryptionResult.ephemeralPublicKey).toBeDefined();

    // Decrypt the message
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    // Original message should match decrypted message
    expect(decryptedMessage).toEqual(message);
  });

  it('should fail MAC verification for tampered ciphertext', () => {
    const message = 'Test message';

    // Encrypt the message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Tamper with the ciphertext
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
    const wrongKeyPair = ecies.generateKeyPair(); // Generate another key pair

    // Encrypt with the correct public key
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Attempt decryption with a different private key
    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        wrongKeyPair.privateKey,
      );
    }).toThrow(); // Expect an error because of the wrong private key
  });

  it('should correctly handle an empty message', () => {
    const message = '';

    // Encrypt the empty message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Decrypt the empty message
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message); // Should return an empty string
  });

  it('should correctly encrypt and decrypt a large message', () => {
    const length = 4096; // 4096 bytes (32768 bits)
    const randomBytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 64); // Generate a random byte between 0 and 64
    }

    const message = Array.from(randomBytes)
      .map((byte) => String.fromCharCode(byte))
      .join(''); // Convert to string

    // Encrypt the large message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Decrypt the large message
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message); // Decrypted should match original
  });
});
