import { describe, it, expect, beforeEach } from 'vitest';
import { ECIES } from '../../onion/crypto/ecies.js'; // Убедитесь, что путь правильный

describe('ECIES Encryption and Decryption', () => {
  let ecies: ECIES;
  let keyPair: { publicKey: string; privateKey: string };

  // Инициализация перед каждым тестом
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

    // Проверка: исходное сообщение должно совпадать с расшифрованным
    expect(decryptedMessage).toEqual(message);
  });

  it('should fail MAC verification for tampered ciphertext', () => {
    const message = 'Test message';

    // Encrypt the message
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Изменяем шифротекст для проверки некорректной верификации MAC
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
