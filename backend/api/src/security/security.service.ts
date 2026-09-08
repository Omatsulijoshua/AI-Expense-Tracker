import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly defaultSecret =
    process.env.ENCRYPTION_KEY || 'default_expense_tracker_secret_key_32bytes!!';

  /**
   * PII Scrubber: Sanitizes personal identifiable information before sending text to AI services
   */
  sanitizeForAi(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // Email regex scrubber
    sanitized = sanitized.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[REDACTED_EMAIL]',
    );

    // Credit card number scrubber (13-19 digits)
    sanitized = sanitized.replace(
      /\b(?:\d[ -]*?){13,19}\b/g,
      '[REDACTED_CARD]',
    );

    // Phone number scrubber
    sanitized = sanitized.replace(
      /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
      '[REDACTED_PHONE]',
    );

    // SSN scrubber (XXX-XX-XXXX)
    sanitized = sanitized.replace(
      /\b\d{3}-\d{2}-\d{4}\b/g,
      '[REDACTED_SSN]',
    );

    return sanitized;
  }

  /**
   * AES-256-CBC Encryption at rest helper
   */
  encryptData(text: string, secretKey: string = this.defaultSecret): string {
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * AES-256-CBC Decryption helper
   */
  decryptData(encryptedText: string, secretKey: string = this.defaultSecret): string {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format');
    }

    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
