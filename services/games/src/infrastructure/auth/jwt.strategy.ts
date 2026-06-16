import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: config.getOrThrow("KEYCLOAK_JWKS_URI"),
        cache: true,
        rateLimit: true,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: config.getOrThrow("KEYCLOAK_ISSUER"),
      algorithms: ["RS256"],
    });
  }

  validate(payload: { sub: string; preferred_username: string }) {
    return { playerId: payload.sub, username: payload.preferred_username };
  }
}
