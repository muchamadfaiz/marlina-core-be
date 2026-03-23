import { PartialType } from '@nestjs/swagger';
import { CreateDivisionDto } from './create-division.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
