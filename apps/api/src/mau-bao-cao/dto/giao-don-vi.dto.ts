import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class GiaoDonViDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  donViIds: number[];
}
