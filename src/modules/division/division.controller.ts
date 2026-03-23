import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage, Roles, PageOptionsDto } from '../../common';
import { DivisionService } from './division.service';
import { CreateDivisionDto, UpdateDivisionDto, DivisionResponseDto } from './dto';

@ApiBearerAuth()
@ApiTags('Divisions')
@Controller('divisions')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create division (Admin only)' })
  @ApiResponse({ status: 201, type: DivisionResponseDto })
  @ResponseMessage('Success create division')
  create(@Body() dto: CreateDivisionDto) {
    return this.divisionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all divisions' })
  @ApiResponse({ status: 200, type: [DivisionResponseDto] })
  @ResponseMessage('Success get divisions')
  findAll(@Query() query: PageOptionsDto) {
    return this.divisionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get division by ID' })
  @ApiResponse({ status: 200, type: DivisionResponseDto })
  @ResponseMessage('Success get division')
  findOne(@Param('id') id: string) {
    return this.divisionService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update division (Admin only)' })
  @ApiResponse({ status: 200, type: DivisionResponseDto })
  @ResponseMessage('Success update division')
  update(@Param('id') id: string, @Body() dto: UpdateDivisionDto) {
    return this.divisionService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete division (Admin only)' })
  @ApiResponse({ status: 204 })
  @ResponseMessage('Success delete division')
  remove(@Param('id') id: string) {
    return this.divisionService.remove(id);
  }
}
