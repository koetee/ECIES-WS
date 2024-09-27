// src/modules/ecies/tests/ecies.test.ts

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
} from '../../modules/ecies/index.js'; // Убедитесь, что путь правильный

describe('ECIES Encryption and Decryption', () => {
  let ecies: ECIES;
  let keyPair: KeyPair;
  let curve: EllipticCurve;
  let cipher: Cipher;
  let kdf: KDF;

  // Инициализация перед каждым тестом
  beforeEach(() => {
    // Создаем экземпляры зависимостей
    curve = new Secp256k1Curve();
    cipher = new AES();
    kdf = new SHA256Kdf();

    // Создаем экземпляр ECIES с зависимостями
    ecies = new ECIES(curve, cipher, kdf);

    // Генерируем ключевую пару для получателя
    keyPair = ecies.generateKeyPair();
  });

  it('should generate valid key pairs', () => {
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('should correctly encrypt and decrypt a message', () => {
    const message = 'Hello, ECIES!';

    // Шифруем сообщение
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    expect(encryptionResult.ciphertext).toBeDefined();
    expect(encryptionResult.mac).toBeDefined();
    expect(encryptionResult.ephemeralPublicKey).toBeDefined();

    // Расшифровываем сообщение
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    // Проверка: исходное сообщение должно совпадать с расшифрованным
    expect(decryptedMessage).toEqual(message);
  });

  it('should correctly handle an empty message', () => {
    const message = '';

    // Шифруем пустое сообщение
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Расшифровываем пустое сообщение
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message); // Должен вернуть пустую строку
  });

  it('should correctly encrypt and decrypt a large message', () => {
    const length = 4096; // 4096 байт (32768 бит)
    const randomBytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 64); // Генерируем случайный байт между 0 и 64
    }

    const message = Array.from(randomBytes)
      .map((byte) => String.fromCharCode(byte))
      .join(''); // Конвертируем в строку

    // Шифруем большое сообщение
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Расшифровываем большое сообщение
    const decryptedMessage = ecies.decrypt(
      encryptionResult.ciphertext,
      encryptionResult.mac,
      encryptionResult.ephemeralPublicKey,
      keyPair.privateKey,
    );

    expect(decryptedMessage).toEqual(message); // Расшифрованный должен совпадать с исходным
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

    expect(decryptedMessages).toEqual(messages); // Каждое сообщение должно быть корректно расшифровано
  });

  it('should fail MAC verification for tampered ciphertext', () => {
    const message = 'Test message';

    // Шифруем сообщение
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

  it('should fail decryption with an incorrect private key', () => {
    const message = 'Hello, ECIES!';
    const wrongKeyPair = ecies.generateKeyPair(); // Генерируем другую пару ключей

    // Шифруем с правильным публичным ключом
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Пытаемся расшифровать с неправильным приватным ключом
    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        wrongKeyPair.privateKey,
      );
    }).toThrow(); // Ожидаем ошибку из-за неправильного приватного ключа
  });

  it('should fail encryption with an invalid public key', () => {
    const message = 'Test with invalid public key';
    const invalidPublicKey = '1234'; // Неверный или поврежденный публичный ключ

    expect(() => {
      ecies.encrypt(message, invalidPublicKey);
    }).toThrow(); // Ожидаем ошибку при использовании неверного публичного ключа
  });

  it('should fail decryption with tampered ephemeral public key', () => {
    const message = 'Test message';

    // Шифруем сообщение
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Изменяем эфемерный публичный ключ
    const tamperedEphemeralKey =
      encryptionResult.ephemeralPublicKey.slice(0, -2) + '00';

    expect(() => {
      ecies.decrypt(
        encryptionResult.ciphertext,
        encryptionResult.mac,
        tamperedEphemeralKey,
        keyPair.privateKey,
      );
    }).toThrow(); // Дешифрование должно провалиться из-за измененного эфемерного публичного ключа
  });

  it('should fail decryption with a truncated ciphertext', () => {
    const message = 'Test message';

    // Шифруем сообщение
    const encryptionResult = ecies.encrypt(message, keyPair.publicKey);

    // Обрезаем шифротекст (например, удаляем несколько байтов)
    const truncatedCiphertext = encryptionResult.ciphertext.slice(0, -5);

    expect(() => {
      ecies.decrypt(
        truncatedCiphertext,
        encryptionResult.mac,
        encryptionResult.ephemeralPublicKey,
        keyPair.privateKey,
      );
    }).toThrow(); // Ожидаем ошибку при дешифровке из-за обрезанного шифротекста
  });

  it('should produce different ciphertexts for the same message with different ephemeral keys', () => {
    const message = 'Repeated message';

    // Шифруем одно и то же сообщение дважды
    const encryptionResult1 = ecies.encrypt(message, keyPair.publicKey);
    const encryptionResult2 = ecies.encrypt(message, keyPair.publicKey);

    // Убедимся, что шифротексты и эфемерные публичные ключи различны
    expect(encryptionResult1.ciphertext).not.toEqual(
      encryptionResult2.ciphertext,
    );
    expect(encryptionResult1.ephemeralPublicKey).not.toEqual(
      encryptionResult2.ephemeralPublicKey,
    );

    // Расшифровываем оба сообщения для проверки корректности
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

    // Оба должны корректно расшифровываться до исходного сообщения
    expect(decryptedMessage1).toEqual(message);
    expect(decryptedMessage2).toEqual(message);
  });
});
