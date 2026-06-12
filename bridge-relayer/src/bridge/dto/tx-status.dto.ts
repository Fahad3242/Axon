import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TxStatusDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'srcTxHash must be a valid 32-byte hex hash prefixed with 0x',
  })
  srcTxHash: string;
}
