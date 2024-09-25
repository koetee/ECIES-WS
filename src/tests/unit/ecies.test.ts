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

    expect(decryptedMessages).toEqual(messages); // Each message should be correctly decrypted
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

  it('should fail encryption with an invalid public key', () => {
    const message = 'Test with invalid public key';
    const invalidPublicKey = '1234'; // Invalid or malformed public key

    expect(() => {
      ecies.encrypt(message, invalidPublicKey);
    }).toThrow(); // Expect an error when using an invalid public key
  });

  it('should fail decryption with tampered ephemeral public key', () => {
    const message = 'Test message';

    // Encrypt the message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Tamper with the ephemeral public key
    const tamperedEphemeralKey =
      encryptionResult.ephemeralPublicKey.slice(0, -2) + '00';

    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        tamperedEphemeralKey,
        keyPair.privateKey,
      );
    }).toThrow(); // Decryption should fail due to the tampered ephemeral public key
  });

  it('should fail decryption with a truncated ciphertext', () => {
    const message = 'Test message';

    // Encrypt the message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Truncate the ciphertext (e.g., remove some bytes)
    const truncatedCiphertext = encryptionResult.ciphertext.slice(0, -5);

    expect(() => {
      ecies.decrypt(
        truncatedCiphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        keyPair.privateKey,
      );
    }).toThrow(); // Expect decryption to fail due to the truncated ciphertext
  });

  it('should produce different ciphertexts for the same message with different ephemeral keys', () => {
    const message = 'Repeated message';

    // Encrypt the same message twice
    const encryptionResult1 = ecies.encrypt(message, keyPair.publicKey);
    const encryptionResult2 = ecies.encrypt(message, keyPair.publicKey);

    // Ensure that ciphertexts and ephemeral public keys are different
    expect(encryptionResult1.ciphertext).not.toEqual(
      encryptionResult2.ciphertext,
    );
    expect(encryptionResult1.ephemeralPublicKey).not.toEqual(
      encryptionResult2.ephemeralPublicKey,
    );

    // Decrypt both to verify correctness
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

    // Both should correctly decrypt to the original message
    expect(decryptedMessage1).toEqual(message);
    expect(decryptedMessage2).toEqual(message);
  });
});
