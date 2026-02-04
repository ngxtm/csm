/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth';
import { UserRoleEnum } from '../users/dto/user.dto';
import {
  AddShipmentItemDto,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/delivery.dto';
import { DeliveriesService } from './deliveries.service';
import type { AuthUser } from '../auth';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  /**
   *
   * @returns
   */
  @Get()
  @ApiOperation({ summary: 'List shipments' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.COORDINATOR)
  findAll() {
    return this.service.findAll();
  }

  /**
   * 
   * @param id 
   * @param user 
   * @returns 
   */
  @Get(':id')
  @ApiOperation({ summary: 'Shipment detail' })
  @ApiParam({ name: 'id', type: Number })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.COORDINATOR, UserRoleEnum.STORE_STAFF)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  /**
   * 
   * @param dto 
   * @param user 
   * @returns 
   */
  @Post()
  @ApiOperation({ summary: 'Create shipment from order' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.COORDINATOR)
  create(@Body() dto: CreateShipmentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  /**
   * 
   * @param id 
   * @param dto 
   * @param user 
   * @returns 
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update shipment status' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.COORDINATOR, UserRoleEnum.STORE_STAFF)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  /**
   * 
   * @param id 
   * @returns 
   */
  @Get(':id/items')
  @ApiOperation({ summary: 'List shipment items' })
  findItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItems(id);
  }

  /**
   * 
   * @param id 
   * @param dto 
   * @returns 
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Add shipment item (with batch)' })
  @Roles(UserRoleEnum.COORDINATOR)
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddShipmentItemDto,
  ) {
    return this.service.addItem(id, dto);
  }
}
