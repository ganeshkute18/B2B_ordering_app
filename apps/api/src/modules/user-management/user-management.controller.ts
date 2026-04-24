import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Role } from '@prisma/client';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserManagementController {
  constructor(private userManagementService: UserManagementService) {}

  @Roles(Role.OWNER)
  @Get()
  listUsers(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.userManagementService.listUsers(
      user.id,
      page,
      limit,
      role,
      approvalStatus as any,
    );
  }

  @Roles(Role.OWNER)
  @Get('statistics')
  getUserStatistics(@CurrentUser() user: User) {
    return this.userManagementService.getUserStatistics(user.id);
  }

  @Roles(Role.OWNER)
  @Get('pending/count')
  getPendingCount(@CurrentUser() user: User) {
    return this.userManagementService.getPendingUsersCount(user.id);
  }

  @Roles(Role.OWNER)
  @Get(':userId')
  getUserDetails(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.userManagementService.getUserDetails(user.id, userId);
  }

  @Roles(Role.OWNER)
  @Post(':userId/approve')
  approveUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() body: { approvalReason?: string },
  ) {
    return this.userManagementService.approveUser(
      user.id,
      userId,
      body.approvalReason,
    );
  }

  @Roles(Role.OWNER)
  @Post(':userId/reject')
  rejectUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() body: { rejectionReason: string },
  ) {
    return this.userManagementService.rejectUser(
      user.id,
      userId,
      body.rejectionReason,
    );
  }

  @Roles(Role.OWNER)
  @Post(':userId/deactivate')
  deactivateUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.userManagementService.deactivateUser(user.id, userId);
  }

  @Roles(Role.OWNER)
  @Post(':userId/reactivate')
  reactivateUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.userManagementService.reactivateUser(user.id, userId);
  }
}
