import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { StoresService } from './stores.service';
import {
  CreateStoreDto,
  StoreQueryDto,
  STORE_TYPES,
  UpdateStoreDto,
} from './dto/store.dto';

/**
 * Stores Controller
 *
 * Manages franchise stores and central kitchen locations.
 */
@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * GET /stores - List stores with optional filters
   */
  @Get()
  @ApiOperation({ summary: 'List stores with optional filters' })
  @ApiQuery({ name: 'type', enum: STORE_TYPES, required: false })
  @ApiQuery({ name: 'is_active', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'List of stores' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  findAll(@Query() query: StoreQueryDto) {
    return this.storesService.findAll(query);
  }

  /**
   * GET /stores/:id - Get store by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.findOne(id);
  }

  /**
   * POST /stores - Create new store
   */
  @Post()
  @ApiOperation({ summary: 'Create new store' })
  @ApiResponse({ status: 201, description: 'Store created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles('admin')
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  /**
   * PUT /stores/:id - Update store
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update store' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Store updated' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Roles('admin', 'manager')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  /**
   * DELETE /stores/:id - Deactivate store
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate store (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Store deactivated' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.delete(id);
  }
}
