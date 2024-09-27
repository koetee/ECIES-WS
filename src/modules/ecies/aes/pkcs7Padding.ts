export class PKCS7Padding {
  static pad(data: string, blockSize: number = 16): string {
    const padSize = blockSize - (data.length % blockSize);
    return data + String.fromCharCode(padSize).repeat(padSize);
  }

  static unpad(data: string): string {
    const padSize = data.charCodeAt(data.length - 1);
    return data.slice(0, -padSize);
  }
}
