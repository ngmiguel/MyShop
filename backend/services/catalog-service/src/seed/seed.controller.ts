import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @ApiOperation({
    summary: 'Seed demo catalog data',
    description: 'Creates 10 categories and 30 products across demo stores if catalog is empty',
  })
  seed() {
    return this.seedService.seed();
  }
}
