export declare class UpsertEmailIntegrationDto {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    smtpFromName: string;
    smtpFromEmail: string;
    smtpSecure?: boolean;
    imapEnabled?: boolean;
    imapHost?: string;
    imapPort?: number;
    imapUser?: string;
    imapPass?: string;
}
