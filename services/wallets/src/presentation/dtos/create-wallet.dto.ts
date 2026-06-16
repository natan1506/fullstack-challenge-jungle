import { ApiProperty } from "@nestjs/swagger";

export class WalletResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  playerId!: string;

  @ApiProperty()
  balance!: number;

  @ApiProperty()
  createdAt!: Date;
}
