import pkg from 'elliptic';
const { ec } = pkg;
import aesjs from 'aes-js';
import sha256 from 'sha.js';

export class ECIES {
  private readonly curve: InstanceType<typeof ec>;

  constructor() {
    this.curve = new ec('secp256k1'); // Using secp256k1 curve, same as Bitcoin and Ethereum
  }

  // Generate key pair (Elliptic Curve)
  public generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = this.curve.genKeyPair();
    return {
      publicKey: keyPair.getPublic('hex'),
      privateKey: keyPair.getPrivate('hex'),
    };
  }

  // Encrypt function: ecIES encryption
  public encrypt(
    plaintext: string,
    receiverPublicKey: string,
  ): { ciphertext: Uint8Array; mac: string; ephemeralPublicKey: string } {
    // Step 1: Generate ephemeral key pair
    const ephemeralKeyPair = this.curve.genKeyPair();
    const ephemeralPublicKey = ephemeralKeyPair.getPublic('hex');

    // Step 2: Key Agreement (ecDH) - shared secret
    const receiverKey = this.curve.keyFromPublic(receiverPublicKey, 'hex');
    const sharedSecret = ephemeralKeyPair.derive(receiverKey.getPublic()); // ecDH shared secret

    // Step 3: Key Derivation (SHA-256 of shared secret)
    const symmetricKey = this.kdf(sharedSecret.toString(16)); // KDF = Key Derivation Function

    // Step 4: Symmetric encryption (AES)
    const iv = this.generateIV();
    const aesCbc = new aesjs.ModeOfOperation.cbc(symmetricKey, iv);
    const paddedPlaintext = this.pad(plaintext);
    const ciphertext = aesCbc.encrypt(
      aesjs.utils.utf8.toBytes(paddedPlaintext),
    );

    // Step 5: Generate MAC (HMAC using SHA-256)
    const mac = this.hmac(ciphertext, symmetricKey);

    return { ciphertext, mac, ephemeralPublicKey };
  }

  // Decrypt function: ecIES decryption
  public decrypt(
    ciphertext: Uint8Array,
    mac: string,
    ephemeralPublicKey: string,
    privateKey: string,
  ): string {
    // Step 1: Get ephemeral public key and derive shared secret
    const ephemeralKey = this.curve.keyFromPublic(ephemeralPublicKey, 'hex');
    const privateKeyObj = this.curve.keyFromPrivate(privateKey, 'hex');
    const sharedSecret = privateKeyObj.derive(ephemeralKey.getPublic());

    // Step 2: Key Derivation (SHA-256 of shared secret)
    const symmetricKey = this.kdf(sharedSecret.toString(16));

    // Step 3: Verify MAC
    const expectedMac = this.hmac(ciphertext, symmetricKey);
    if (expectedMac !== mac) {
      throw new Error('MAC verification failed');
    }

    // Step 4: Symmetric decryption (AES)
    const iv = this.generateIV();
    const aesCbc = new aesjs.ModeOfOperation.cbc(symmetricKey, iv);
    const decryptedBytes = aesCbc.decrypt(ciphertext);
    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    return this.unpad(decryptedText);
  }

  // Key Derivation Function (KDF): Derive symmetric key from shared secret
  private kdf(sharedSecret: string): Uint8Array {
    return sha256('SHA256')
      .update(sharedSecret, 'hex')
      .digest()
      .subarray(0, 16); // Derive 128-bit AES key
  }

  // Generate Initialization Vector for AES encryption
  private generateIV(): Uint8Array {
    return aesjs.utils.hex.toBytes('000102030405060708090a0b0c0d0e0f'); // Fixed IV for simplicity
  }

  // HMAC (SHA-256 based)
  private hmac(data: Uint8Array, key: Uint8Array): string {
    const combined = new Uint8Array([...key, ...data]); // Создаем единый Uint8Array из двух массивов
    return sha256('SHA256').update(combined).digest('hex');
  }

  // Padding for AES block size (PKCS7)
  private pad(text: string): string {
    const blockSize = 16;
    const padSize = blockSize - (text.length % blockSize);
    const padding = String.fromCharCode(padSize).repeat(padSize);
    return text + padding;
  }

  // Unpadding for AES decryption
  private unpad(text: string): string {
    const padSize = text.charCodeAt(text.length - 1);
    return text.slice(0, -padSize);
  }
}
