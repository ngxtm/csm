import { Global, Module } from '@nestjs/common';
import { SupabaseService, CodeGeneratorService } from './services';

/**
 * CommonModule - Shared Services Module
 *
 * Cung cấp các services dùng chung cho toàn bộ app:
 * - SupabaseService: Singleton DB client
 * - CodeGeneratorService: Generate unique codes
 *
 * GLOBAL MODULE: Các services được export từ đây sẽ available
 * ở mọi module mà không cần import lại.
 *
 * USAGE trong các modules khác:
 * ```typescript
 * @Injectable()
 * export class OrdersService {
 *   constructor(
 *     private supabase: SupabaseService,        // ← Inject trực tiếp
 *     private codeGenerator: CodeGeneratorService,
 *   ) {}
 * }
 * ```
 *
 * NOTE: Factories (EntityFactory, StatusFactory) là abstract classes,
 * không cần provide ở đây. Các concrete factories được provide
 * trong từng module riêng (OrdersModule, ShipmentsModule, etc.)
 */
@Global()
@Module({
  providers: [SupabaseService, CodeGeneratorService],
  exports: [SupabaseService, CodeGeneratorService],
})
export class CommonModule {}
