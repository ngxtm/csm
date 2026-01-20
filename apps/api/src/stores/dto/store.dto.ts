import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Store DTOs
 *
 * Store types: franchise (ordering stores), central_kitchen (production)
 */

export const STORE_TYPES = ['franchise', 'central_kitchen'] as const;
export type StoreType = (typeof STORE_TYPES)[number];

// ═══════════════════════════════════════════════════════════
// CREATE STORE
// ═══════════════════════════════════════════════════════════

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name', example: 'Central Kitchen HCM' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Store address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'Store type',
    enum: STORE_TYPES,
    example: 'franchise',
  })
  @IsIn(STORE_TYPES)
  type: StoreType;

  @ApiPropertyOptional({ description: 'Phone number', example: '0901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Custom settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════
// UPDATE STORE
// ═══════════════════════════════════════════════════════════

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}

// ═══════════════════════════════════════════════════════════
// QUERY FILTERS
// ═══════════════════════════════════════════════════════════

export class StoreQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: STORE_TYPES,
  })
  @IsOptional()
  @IsIn(STORE_TYPES)
  type?: StoreType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
