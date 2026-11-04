import {
  Injectable,
  Inject,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { OAuth2Client, CodeChallengeMethod } from "google-auth-library";
import type { Request, Response } from "express";
import type { Profile } from "@toeic/shared";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const cookieName = "toeic_session";
export type LearnerRequest = Request & {
  learner: Profile;
  sessionHash: string;
};
export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
@Injectable()
export class AuthService {
  constructor(@Inject(DataSource) private readonly db: DataSource) {}
  googleEnabled() {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALLBACK_URL,
    );
  }
  cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 86400000,
    };
  }
  async createSession(
    userId: string,
    res: Response,
    mergeFrom: string | null = null,
  ) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    await this.db.query(
      "INSERT INTO app_sessions(token_hash,user_id,merge_from,expires_at) VALUES($1,$2,$3,now()+interval '30 days')",
      [tokenHash, userId, mergeFrom],
    );
    res.cookie(cookieName, token, this.cookieOptions());
    return tokenHash;
  }
  async session(
    req: Request,
    res: Response,
  ): Promise<{ user: Profile; sessionHash: string }> {
    const token = req.cookies?.[cookieName];
    const tokenHash =
      typeof token === "string" && token.length < 200 ? hash(token) : "";
    const rows = await this.db.query(
      `SELECT u.*,s.merge_from FROM app_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [tokenHash],
    );
    if (rows[0]) {
      const user = rows[0];
      const merge = user.merge_from
        ? await this.db.query(
            "SELECT count(*)::int AS n FROM attempts WHERE user_id=$1",
            [user.merge_from],
          )
        : [{ n: 0 }];
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          guest: user.is_guest,
          googleEnabled: this.googleEnabled(),
          mergeCount: merge[0].n,
        },
        sessionHash: tokenHash,
      };
    }
    const id = randomUUID();
    await this.db.transaction(async (m) => {
      await m.query("INSERT INTO users(id,name) VALUES($1,'Guest learner')", [
        id,
      ]);
      await m.query("INSERT INTO preferences(user_id) VALUES($1)", [id]);
    });
    const sessionHash = await this.createSession(id, res);
    return {
      user: {
        id,
        name: "Guest learner",
        email: null,
        avatar: null,
        guest: true,
        googleEnabled: this.googleEnabled(),
        mergeCount: 0,
      },
      sessionHash,
    };
  }
  client() {
    if (!this.googleEnabled())
      throw new ServiceUnavailableException(
        "Google sign-in is not configured on this server. Guest practice is available.",
      );
    return new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }
  async begin(req: LearnerRequest, res: Response) {
    const client = this.client();
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const { codeVerifier, codeChallenge } =
      await client.generateCodeVerifierAsync();
    await this.db.query("DELETE FROM oauth_states WHERE expires_at<now()");
    await this.db.query(
      "INSERT INTO oauth_states VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
      [hash(state), codeVerifier, nonce, req.sessionHash],
    );
    res.cookie("toeic_oauth", state, {
      ...this.cookieOptions(),
      path: "/api/v1/auth",
      maxAge: 600000,
    });
    res.redirect(
      client.generateAuthUrl({
        scope: ["openid", "email", "profile"],
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
      }),
    );
  }
  async callback(req: LearnerRequest, res: Response) {
    const state = req.query.state,
      code = req.query.code,
      expected = req.cookies?.toeic_oauth;
    if (
      typeof state !== "string" ||
      typeof code !== "string" ||
      typeof expected !== "string" ||
      !sameSecret(state, expected)
    )
      throw new UnauthorizedException(
        "Google sign-in expired or its state is invalid. Please try again.",
      );
    const [rows] = await this.db.query(
      "DELETE FROM oauth_states WHERE state_hash=$1 AND session_hash=$2 AND expires_at>now() RETURNING *",
      [hash(state), req.sessionHash],
    );
    if (!rows[0])
      throw new UnauthorizedException(
        "This sign-in link has expired or was already used.",
      );
    const flow = rows[0],
      client = this.client();
    const { tokens } = await client.getToken({
      code,
      codeVerifier: flow.verifier,
    });
    if (!tokens.id_token)
      throw new UnauthorizedException(
        "Google did not return an identity token.",
      );
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (
      !profile?.sub ||
      !profile.email_verified ||
      profile.nonce !== flow.nonce
    )
      throw new UnauthorizedException("Google identity could not be verified.");
    const userId = await this.db.transaction(async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        profile.sub,
      ]);
      const existing = await m.query(
        "SELECT user_id FROM oauth_identities WHERE provider='google' AND subject=$1",
        [profile.sub],
      );
      if (existing[0]) return existing[0].user_id as string;
      const id = randomUUID();
      await m.query(
        "INSERT INTO users(id,name,email,avatar,is_guest) VALUES($1,$2,$3,$4,false)",
        [
          id,
          profile.name || "Learner",
          profile.email || null,
          profile.picture || null,
        ],
      );
      await m.query("INSERT INTO oauth_identities VALUES('google',$1,$2)", [
        profile.sub,
        id,
      ]);
      await m.query("INSERT INTO preferences(user_id) VALUES($1)", [id]);
      return id;
    });
    await this.createSession(
      userId,
      res,
      req.learner.guest ? req.learner.id : null,
    );
    await this.db.query("DELETE FROM app_sessions WHERE token_hash=$1", [
      req.sessionHash,
    ]);
    res.clearCookie("toeic_oauth", { path: "/api/v1/auth" });
    res.redirect(
      new URL(
        "/account?signin=success",
        process.env.WEB_ORIGIN || "http://127.0.0.1:3000",
      ).toString(),
    );
  }
  async logout(req: LearnerRequest, res: Response) {
    await this.db.query("DELETE FROM app_sessions WHERE token_hash=$1", [
      req.sessionHash,
    ]);
    res.clearCookie(cookieName, { path: "/" });
    return { ok: true };
  }
  async merge(req: LearnerRequest) {
    if (req.learner.guest) throw new UnauthorizedException("Sign in first.");
    await this.db.transaction(async (m) => {
      const sessions = await m.query(
        "SELECT merge_from FROM app_sessions WHERE token_hash=$1 FOR UPDATE",
        [req.sessionHash],
      );
      const source = sessions[0]?.merge_from;
      if (source) {
        await m.query(
          `UPDATE attempts a SET imported_key=a.imported_key||':merged:'||a.id::text
          WHERE a.user_id=$2 AND a.imported_key IS NOT NULL AND EXISTS(
            SELECT 1 FROM attempts existing WHERE existing.user_id=$1 AND existing.imported_key=a.imported_key)`,
          [req.learner.id, source],
        );
        await m.query("UPDATE attempts SET user_id=$1 WHERE user_id=$2", [
          req.learner.id,
          source,
        ]);
        await m.query(
          "UPDATE app_sessions SET merge_from=null WHERE token_hash=$1",
          [req.sessionHash],
        );
      }
    });
    return { ok: true };
  }
}
