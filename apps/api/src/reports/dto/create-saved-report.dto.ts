import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSavedReportDto {
  @IsString()
  name: string;

  @IsString()
  reportType: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}
