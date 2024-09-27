import { EllipticCurve } from './ellipticCurve.js';
import { KeyPair } from '../interfaces/keyPair.js';
import pkg from 'elliptic';
const { ec } = pkg;

export class Secp256k1Curve extends EllipticCurve {
  private curve: InstanceType<typeof ec>;

  constructor() {
    super();
    this.curve = new ec('secp256k1');
  }

  generateKeyPair(): KeyPair {
    const keyPair = this.curve.genKeyPair();
    return {
      publicKey: keyPair.getPublic('hex'),
      privateKey: keyPair.getPrivate('hex'),
    };
  }

  deriveSharedSecret(privateKey: string, publicKey: string): string {
    const receiverKey = this.curve.keyFromPublic(publicKey, 'hex');
    const privateKeyObj = this.curve.keyFromPrivate(privateKey, 'hex');
    return privateKeyObj.derive(receiverKey.getPublic()).toString(16);
  }
}
