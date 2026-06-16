/**
 * RefreshTokenDto — intentionally empty.
 *
 * The refresh token is never sent in the request body. It is stored in an
 * httpOnly + Secure + SameSite=Strict cookie and read directly from
 * `req.cookies.refresh_token` in the controller. This DTO exists as a
 * Swagger / class-validator placeholder to satisfy NestJS conventions and
 * to make the endpoint self-documenting.
 */
export class RefreshTokenDto {}
