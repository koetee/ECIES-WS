import { KDF } from '../interfaces/kdf.js';
import sha256 from 'sha.js';

export class SHA256Kdf implements KDF {
  deriveKey(sharedSecret: string): Uint8Array {
    return sha256('SHA256')
      .update(sharedSecret, 'hex')
      .digest()
      .subarray(0, 16); // 128-bit key
  }
}
