import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

export class AttendanceQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by exact date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  date?: string;
}
