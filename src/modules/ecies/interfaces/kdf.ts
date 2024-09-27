export interface KDF {
  deriveKey(sharedSecret: string): Uint8Array;
}
