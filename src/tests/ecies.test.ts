import { describe, it, expect, beforeEach } from 'vitest';
import { ECIES } from '../modules/ecies/index.js'; // Убедитесь, что путь правильный

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
});
