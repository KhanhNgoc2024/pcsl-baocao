import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class GiaoDonViBcvbDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  donViIds: number[];
}
