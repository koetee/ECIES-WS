export interface Cipher {
  encrypt(
    plaintext: string,
    key: Uint8Array,
  ): { ciphertext: Uint8Array; mac: string };
  decrypt(ciphertext: Uint8Array, mac: string, key: Uint8Array): string;
}
