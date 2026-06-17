import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, mail: MailService);
    register(dto: RegisterDto, ip?: string, ua?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string, ip?: string, ua?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(rawRefreshToken: string, ip?: string, ua?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(rawRefreshToken: string): Promise<void>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(rawToken: string, newPassword: string): Promise<void>;
    issueTokens(userId: string, orgId: string, role: Role, email: string, ip?: string, ua?: string, existingFamilyId?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private hashToken;
    private slugify;
    private parseExpiry;
}
