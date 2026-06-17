import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload, Role } from '@opsnext/shared';
import { EmailIntegrationsService } from './email-integrations.service';
import { UpsertEmailIntegrationDto } from './dto/upsert-email-integration.dto';

@ApiTags('email-integrations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email-integrations')
export class EmailIntegrationsController {
  constructor(private readonly service: EmailIntegrationsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current organization email integration' })
  @ApiOkResponse({ description: 'Email integration config (passwords omitted)' })
  findOne(@CurrentUser() user: UserPayload) {
    return this.service.findByOrg(user.orgId);
  }

  @Put()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create or update email integration' })
  @ApiOkResponse({ description: 'Upserted email integration (passwords omitted)' })
  upsert(@Body() dto: UpsertEmailIntegrationDto, @CurrentUser() user: UserPayload) {
    return this.service.upsert(user.orgId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove email integration' })
  @ApiNoContentResponse({ description: 'Integration deleted' })
  remove(@CurrentUser() user: UserPayload) {
    return this.service.remove(user.orgId);
  }

  @Post('test')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Test SMTP connection' })
  @ApiOkResponse({ description: '{ success: boolean, error?: string }' })
  testSmtp(@CurrentUser() user: UserPayload) {
    return this.service.testSmtp(user.orgId);
  }
}
