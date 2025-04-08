import { Injectable } from '@angular/core';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class JsonFormatterService {
  private key = '7061737323313233';
  private iv = '7061737323313233';
  constructor() { }

  // Repair input by removing unnecessary quotes
  repairInput(inputValue: string): string {
    let input = inputValue || '';
    try {
      if (typeof input === 'string') {
        if (
          (input.startsWith('"') && input.endsWith('"')) ||
          (input.startsWith("'") && input.endsWith("'"))
        ) {
          input = input.substring(1, input.length - 1);
        } else if (input.startsWith('"') || input.startsWith("'")) {
          input = input.substring(1, input.length);
        } else if (input.endsWith('"') || input.endsWith("'")) {
          input = input.substring(0, input.length - 1);
        }
      }
    } catch (error) {
      console.error('Error repairing input:', error);
    }
    return input;
  }

  // Validate and parse input
  checkInput(input: string): {
    isValid: boolean;
    parsedValue?: any;
    isBase64?: boolean;
    errorMessage: string;
  } {
    if (!input?.trim()) {
      return { isValid: false, errorMessage: 'Input is empty' };
    }

    let parsedValue;
    let isBase64 = false;
    try {
      const decoded = atob(input);
      try {
        parsedValue = JSON.parse(decoded);
        isBase64 = true;
      } catch {
        parsedValue = decoded;
      }
    } catch {
      try {
        parsedValue = JSON.parse(input);
      } catch (e: any) {
        return { isValid: false, errorMessage: e.message };
      }
    }

    return { isValid: true, parsedValue, isBase64, errorMessage: '' };
  }

  // Format JSON with proper indentation
  formatJson(input: string): string {
    const repairedInput = this.repairInput(input);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      return checkResult.errorMessage;
    }

    try {
      const parsed = checkResult.parsedValue;
      return JSON.stringify(parsed, null, 2);
    } catch (e: any) {
      return e.message;
    }
  }

  // Minify JSON
  minifyJson(input: string): string {
    const repairedInput = this.repairInput(input);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      return checkResult.errorMessage;
    }

    try {
      const parsed = checkResult.parsedValue;
      return JSON.stringify(parsed);
    } catch (e: any) {
      return e.message;
    }
  }

  // Encode to Base64
  encode(input: string): string {
    const repairedInput = this.repairInput(input);
    if (!repairedInput.trim()) {
      return 'Input is empty';
    }

    try {
      return btoa(repairedInput);
    } catch (e: any) {
      return e.message;
    }
  }

  // Decode and format
  decodeAndFormat(input: string): string {
    const repairedInput = this.repairInput(input);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      return checkResult.errorMessage;
    }

    try {
      let finalValue = checkResult.parsedValue;

      if (checkResult.isBase64) {
        const decoded = atob(repairedInput);
        try {
          finalValue = JSON.parse(decoded);
        } catch {
          finalValue = decoded;
        }
      }

      if (typeof finalValue === 'object' && finalValue !== null) {
        return JSON.stringify(finalValue, null, 2);
      }
      return finalValue;
    } catch (e: any) {
      return `Processing failed: ${e.message}`;
    }
  }

  // Encrypt using AES
  encrypt(value: string): string {
    if (!value) {
      return 'Input is empty';
    }
    try {
      const key = CryptoJS.enc.Utf8.parse(this.key);
      const iv = CryptoJS.enc.Utf8.parse(this.iv);
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(value),
        key,
        {
          keySize: 128 / 8,
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
      return encrypted.toString();
    } catch (e: any) {
      return e.message;
    }
  }

  // Decrypt AES encrypted string
  decrypt(value: string): string {
    if (!value) {
      return 'Input is empty';
    }
    try {
      const key = CryptoJS.enc.Utf8.parse(this.key);
      const iv = CryptoJS.enc.Utf8.parse(this.iv);
      const decrypted = CryptoJS.AES.decrypt(value, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8);

      if (decrypted) {
        try {
          const parsed = JSON.parse(decrypted);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return decrypted;
        }
      }
      return 'Decryption failed';
    } catch (e: any) {
      return e.message;
    }
  }

  // Generate sample data
  getSampleData(): string {
    return `{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "isActive": true,
  "roles": [
    "admin",
    "editor"
  ],
  "profile": {
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "country": "USA"
    }
  },
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2025-02-06T12:00:00Z",
  "updatedAt": "2025-02-06T12:30:00Z"
}`;
  }

  downloadContent() {

  }
}
