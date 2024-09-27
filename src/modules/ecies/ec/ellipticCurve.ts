import { KeyPair } from '../interfaces/keyPair.js';

export abstract class EllipticCurve {
  abstract generateKeyPair(): KeyPair;
  abstract deriveSharedSecret(privateKey: string, publicKey: string): string;
}
