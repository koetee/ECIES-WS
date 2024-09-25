import { ECIES } from './modules/ecies/index.js'; // Убедитесь, что путь правильный

// Функция для логирования
function log(message: string, data?: unknown): void {
  if (data) {
    console.log(`${message}:`, data);
  } else {
    console.log(message);
  }
}

// Пример использования ECIES с логами
function exampleECIES(): void {
  // Создаем экземпляр ECIES
  const ecies = new ECIES();

  // Генерируем ключевую пару (отправитель)
  const senderKeyPair = ecies.generateKeyPair();
  log('Sender key pair generated', senderKeyPair);

  // Генерируем ключевую пару (получатель)
  const receiverKeyPair = ecies.generateKeyPair();
  log('Receiver key pair generated', receiverKeyPair);

  // Сообщение для шифрования
  const message = 'Hello, ECIES!';
  log('Message to encrypt', message);

  // Шифруем сообщение, используя публичный ключ получателя
  const encryptionResult = ecies.encrypt(message, receiverKeyPair.publicKey);
  log('Encryption result', encryptionResult);

  // Расшифровываем сообщение, используя приватный ключ получателя
  const decryptedMessage = ecies.decrypt(
    encryptionResult.ciphertext,
    encryptionResult.mac,
    encryptionResult.ephemeralPublicKey,
    receiverKeyPair.privateKey,
  );
  log('Decrypted message', decryptedMessage);

  // Проверяем, совпадает ли исходное сообщение с расшифрованным
  if (message === decryptedMessage) {
    log('Success! Decrypted message matches the original');
  } else {
    log('Error! Decrypted message does NOT match the original');
  }
}

// Запускаем пример
exampleECIES();
