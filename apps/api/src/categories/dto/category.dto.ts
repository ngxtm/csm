import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Category DTOs
 *
 * Categories: Raw Materials, Semi-Finished, Finished Products, Packaging
 */

// ═══════════════════════════════════════════════════════════
// CREATE CATEGORY
// ═══════════════════════════════════════════════════════════

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Raw Materials' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// ═══════════════════════════════════════════════════════════
// UPDATE CATEGORY
// ═══════════════════════════════════════════════════════════

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
