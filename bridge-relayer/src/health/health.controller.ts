import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'number', example: 1718228723000 },
      },
    },
  })
  check() {
    return { status: 'ok', timestamp: Date.now() };
  }
}
