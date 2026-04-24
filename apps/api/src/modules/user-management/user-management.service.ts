import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { Role, ApprovalStatus } from '@prisma/client';

@Injectable()
export class UserManagementService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * List all users (paginated) - Owner only
   */
  async listUsers(
    ownerId: string,
    page = 1,
    limit = 20,
    role?: Role,
    approvalStatus?: ApprovalStatus,
  ) {
    // Verify owner
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can access user management');
    }

    const where: any = {};
    if (role) where.role = role;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          businessName: true,
          approvalStatus: true,
          approvedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user details - Owner only
   */
  async getUserDetails(ownerId: string, userId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can access user management');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        businessName: true,
        address: true,
        approvalStatus: true,
        approvalReason: true,
        rejectionReason: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Approve a pending user - Owner only
   */
  async approveUser(ownerId: string, userId: string, approvalReason?: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can approve users');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.approvalStatus === 'APPROVED') {
      throw new BadRequestException('User is already approved');
    }

    // Update user approval status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'APPROVED',
        approvalReason,
        approvedBy: ownerId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
      },
    });

    // Send approval email
    try {
      await this.emailService.sendApprovalEmail(user.email, user.name, approvalReason);
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }

    return {
      message: 'User approved successfully',
      user: updatedUser,
    };
  }

  /**
   * Reject a pending user - Owner only
   */
  async rejectUser(ownerId: string, userId: string, rejectionReason: string) {
    if (!rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can reject users');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Only pending users can be rejected');
    }

    // Update user approval status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason,
        approvedBy: ownerId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
      },
    });

    // Send rejection email
    try {
      await this.emailService.sendRejectionEmail(user.email, user.name, rejectionReason);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }

    return {
      message: 'User rejected',
      user: updatedUser,
    };
  }

  /**
   * Deactivate a user - Owner only
   */
  async deactivateUser(ownerId: string, userId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can deactivate users');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return {
      message: 'User deactivated successfully',
      user: updatedUser,
    };
  }

  /**
   * Reactivate a user - Owner only
   */
  async reactivateUser(ownerId: string, userId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can reactivate users');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return {
      message: 'User reactivated successfully',
      user: updatedUser,
    };
  }

  /**
   * Get pending users count - For dashboard
   */
  async getPendingUsersCount(ownerId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can access user management');
    }

    const pendingCount = await this.prisma.user.count({
      where: { approvalStatus: 'PENDING' },
    });

    return { pendingCount };
  }

  /**
   * Get user statistics - For dashboard
   */
  async getUserStatistics(ownerId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can access user management');
    }

    const [
      totalUsers,
      totalCustomers,
      totalStaff,
      emailVerifiedCount,
      pendingApprovalCount,
      activeUsersCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.user.count({ where: { role: Role.STAFF } }),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      totalCustomers,
      totalStaff,
      emailVerifiedCount,
      pendingApprovalCount,
      activeUsersCount,
    };
  }
}
