import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TxStatusDto {
  @ApiProperty({
    description: 'The source transaction hash (0x-prefixed 32-byte hex string)',
    example: '0xc9f09872cb98739024f203a4eb1b7f2ecc0cbc0cedd53a10ca046f3128fd4582',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'srcTxHash must be a valid 32-byte hex hash prefixed with 0x',
  })
  srcTxHash: string;
}
