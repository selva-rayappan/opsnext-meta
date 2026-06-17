import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserPayload, Role } from '@opsnext/shared';
import { EmailsService } from './emails.service';
import { ComposeEmailDto } from './dto/compose-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';

// 1x1 transparent GIF
const TRACKING_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@ApiTags('emails')
@Controller('emails')
export class EmailsController {
  constructor(private readonly service: EmailsService) {}

  // ---------------------------------------------------------------------------
  // Thread endpoints (authenticated)
  // ---------------------------------------------------------------------------

  @Get('threads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List email threads for the organization' })
  @ApiOkResponse({ description: 'List of threads with last message preview' })
  listThreads(
    @Query('contactId') contactId: string | undefined,
    @Query('opportunityId') opportunityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.listThreads(user.orgId, contactId, opportunityId);
  }

  @Get('threads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get email thread with all messages' })
  @ApiOkResponse({ description: 'Thread with messages and tracking events' })
  @ApiNotFoundResponse({ description: 'Thread not found' })
  getThread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.getThread(id, user.orgId);
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Compose and send a new email (creates thread)' })
  @ApiOkResponse({ description: 'Created thread and first message' })
  compose(@Body() dto: ComposeEmailDto, @CurrentUser() user: UserPayload) {
    return this.service.compose(dto, user.sub, user.orgId);
  }

  @Post('threads/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reply to an existing email thread' })
  @ApiOkResponse({ description: 'New reply message' })
  @ApiNotFoundResponse({ description: 'Thread not found' })
  reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyEmailDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.reply(id, dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Tracking endpoints (public — called by email clients)
  // ---------------------------------------------------------------------------

  @Get('track/open/:messageId')
  @Public()
  @ApiOperation({ summary: 'Record email open event (returns 1x1 GIF)' })
  async trackOpen(
    @Param('messageId') messageId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Fire-and-forget — never block the pixel response for DB errors
    this.service
      .recordTrackingEvent(messageId, 'OPEN', null, req.ip, req.headers['user-agent'])
      .catch(() => {});

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.send(TRACKING_GIF);
  }

  @Get('track/click/:messageId/:encodedUrl')
  @Public()
  @ApiOperation({ summary: 'Record click event and redirect to original URL' })
  async trackClick(
    @Param('messageId') messageId: string,
    @Param('encodedUrl') encodedUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const url = Buffer.from(encodedUrl, 'base64url').toString('utf8');

    // Fire-and-forget
    this.service
      .recordTrackingEvent(messageId, 'CLICK', url, req.ip, req.headers['user-agent'])
      .catch(() => {});

    res.redirect(302, url);
  }
}
