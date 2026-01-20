import { Injectable } from '@nestjs/common';

/**
 * CodeGeneratorService - Singleton Code Generator
 *
 * Generates unique codes for entities like Orders, Shipments, Batches, etc.
 * Format: {PREFIX}-{YYYYMMDD}-{RANDOM}
 *
 * USAGE:
 * ```typescript
 * @Injectable()
 * export class OrdersService {
 *   constructor(private codeGenerator: CodeGeneratorService) {}
 *
 *   async create() {
 *     const orderCode = this.codeGenerator.generate('ORD');
 *     // Returns: ORD-20260119-A1B2C
 *   }
 * }
 * ```
 *
 * PREFIXES:
 * - ORD: Orders
 * - SHP: Shipments
 * - BAT: Batches
 * - PP: Production Plans
 * - INV: Inventory Transactions
 */
@Injectable()
export class CodeGeneratorService {
  /**
   * Generate a unique code with given prefix
   * Format: {PREFIX}-{YYYYMMDD}-{5-char random}
   *
   * @param prefix - Entity prefix (e.g., 'ORD', 'SHP', 'BAT')
   * @returns Unique code string
   */
  generate(prefix: string): string {
    const date = this.getDateString();
    const random = this.getRandomString(5);
    return `${prefix}-${date}-${random}`;
  }

  /**
   * Generate code with custom length for random part
   */
  generateWithLength(prefix: string, randomLength: number): string {
    const date = this.getDateString();
    const random = this.getRandomString(randomLength);
    return `${prefix}-${date}-${random}`;
  }

  /**
   * Generate short code without date
   * Format: {PREFIX}-{8-char random}
   */
  generateShort(prefix: string): string {
    const random = this.getRandomString(8);
    return `${prefix}-${random}`;
  }

  /**
   * Get current date as YYYYMMDD string
   */
  private getDateString(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  /**
   * Generate random alphanumeric string (uppercase)
   */
  private getRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length)
      .toUpperCase();
  }
}
