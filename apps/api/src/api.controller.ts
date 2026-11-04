import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
  Inject,
  HttpCode,
  ParseUUIDPipe,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiCookieAuth } from "@nestjs/swagger";
import { z } from "zod";
import { PARTS } from "@toeic/shared";
import { AuthService, type LearnerRequest } from "./auth/auth.service";
import { AttemptService } from "./assessments/attempt.service";
import { ProgressService } from "./progress/progress.service";
import type { Response } from "express";
import { legacySchema } from "./assessments/legacy";
import { DataSource } from "typeorm";
const choice = z.enum(["A", "B", "C", "D"]);
const revision = z.number().int().min(0);
const skill = z.enum([
  "detail",
  "inference",
  "purpose",
  "grammar",
  "vocabulary",
  "reading-comprehension",
  "listening-comprehension",
]);
const startSchema = z
  .object({
    mode: z.enum(["focused", "quick", "mock"]),
    part: z
      .enum(
        Object.keys(PARTS) as [keyof typeof PARTS, ...(keyof typeof PARTS)[]],
      )
      .optional(),
    count: z.number().int().min(1).max(100).optional(),
    timed: z.boolean().optional(),
    immediate: z.boolean().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    skill: skill.optional(),
    replay: z.boolean().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.mode === "mock" && v.count !== undefined && v.count !== 100)
      ctx.addIssue({
        code: "custom",
        message: "Only the 100-question shortened mock is available.",
      });
    if (
      v.mode !== "focused" &&
      (v.immediate || v.replay || v.difficulty || v.skill || v.part)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Immediate feedback, part filters, and replay are available in focused practice.",
      });
    if (v.mode === "focused" && v.timed)
      ctx.addIssue({ code: "custom", message: "Focused practice is untimed." });
  });
@ApiTags("TOEIC Practice")
@ApiCookieAuth()
@Controller()
export class ApiController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AttemptService) private readonly attempts: AttemptService,
    @Inject(ProgressService) private readonly progress: ProgressService,
    @Inject(DataSource) private readonly db: DataSource,
  ) {}
  @Get("health") health() {
    return { ok: true, service: "toeic-api" };
  }
  @Get("ready") async ready() {
    try {
      await this.db.query("SELECT 1");
      return { ok: true };
    } catch {
      throw new ServiceUnavailableException("Database unavailable.");
    }
  }
  @Get("auth/me") me(@Req() req: LearnerRequest) {
    return req.learner;
  }
  @Get("auth/google") google(@Req() req: LearnerRequest, @Res() res: Response) {
    return this.auth.begin(req, res);
  }
  @Get("auth/google/callback") callback(
    @Req() req: LearnerRequest,
    @Res() res: Response,
  ) {
    return this.auth
      .callback(req, res)
      .catch(() =>
        res.redirect(
          new URL(
            "/account?signin=failed",
            process.env.WEB_ORIGIN || "http://127.0.0.1:3000",
          ).toString(),
        ),
      );
  }
  @Post("auth/logout") @HttpCode(200) logout(
    @Req() req: LearnerRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res);
  }
  @Post("auth/merge-guest") @HttpCode(200) merge(@Req() req: LearnerRequest) {
    return this.auth.merge(req);
  }
  @Get("assessments/blueprints") catalog(
    @Req() req: LearnerRequest,
    @Query() query: unknown,
  ) {
    return this.attempts.catalog(
      req.learner.id,
      z
        .object({
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          skill: skill.optional(),
          replay: z
            .enum(["true", "false"])
            .transform((v) => v === "true")
            .optional(),
        })
        .strict()
        .parse(query),
    );
  }
  @Get("dashboard/overview") overview(@Req() req: LearnerRequest) {
    return this.progress.overview(req.learner);
  }
  @Get("insights/skills") async skills(@Req() req: LearnerRequest) {
    const o = await this.progress.overview(req.learner);
    return { parts: o.parts, skills: o.skills };
  }
  @Get("insights/history") async history(@Req() req: LearnerRequest) {
    return (await this.progress.overview(req.learner)).history;
  }
  @Get("practice/recommendations") async recommendation(
    @Req() req: LearnerRequest,
  ) {
    return (await this.progress.overview(req.learner)).recommendation;
  }
  @Patch("users/preferences")
  @ApiBody({
    schema: {
      type: "object",
      required: ["goal", "weeklyTarget"],
      properties: {
        goal: { type: "integer", nullable: true, minimum: 1, maximum: 100 },
        weeklyTarget: { type: "integer", minimum: 5, maximum: 500 },
      },
    },
  })
  preferences(@Req() req: LearnerRequest, @Body() body: unknown) {
    return this.progress.preferences(
      req.learner.id,
      z
        .object({
          goal: z.number().int().min(1).max(100).nullable(),
          weeklyTarget: z.number().int().min(5).max(500),
        })
        .strict()
        .parse(body),
    );
  }
  @Get("attempts") list(@Req() req: LearnerRequest, @Query() query: unknown) {
    return this.progress.history(
      req.learner.id,
      z
        .object({
          offset: z.coerce.number().int().min(0).max(1000000).default(0),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          mode: z.enum(["focused", "quick", "mock"]).optional(),
        })
        .strict()
        .parse(query),
    );
  }
  @Post("attempts/import")
  importLegacy(@Req() req: LearnerRequest, @Body() body: unknown) {
    return this.attempts.importLegacy(req.learner.id, legacySchema.parse(body));
  }
  @Post("attempts")
  @ApiOperation({ summary: "Start a versioned, group-preserving assessment" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["mode"],
      properties: {
        mode: { type: "string", enum: ["focused", "quick", "mock"] },
        part: { type: "string", enum: Object.keys(PARTS) },
        count: { type: "integer" },
        timed: { type: "boolean" },
        immediate: { type: "boolean" },
        replay: { type: "boolean" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      },
    },
  })
  start(@Req() req: LearnerRequest, @Body() body: unknown) {
    return this.attempts.start(req.learner.id, startSchema.parse(body));
  }
  @Get("attempts/:id") attempt(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.attempts.get(req.learner.id, id);
  }
  @Patch("attempts/:id/answers/:questionId")
  @ApiBody({
    schema: {
      type: "object",
      required: ["revision", "choiceId"],
      properties: {
        revision: { type: "integer" },
        choiceId: { type: "string", enum: ["A", "B", "C", "D"] },
      },
    },
  })
  answer(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("questionId") questionId: string,
    @Body() body: unknown,
  ) {
    return this.attempts.mutate(req.learner.id, id, {
      ...z.object({ revision, choiceId: choice }).strict().parse(body),
      questionId: z.string().max(100).parse(questionId),
    });
  }
  @Patch("attempts/:id/progress")
  @ApiBody({
    schema: {
      type: "object",
      required: ["revision"],
      properties: {
        revision: { type: "integer" },
        currentIndex: { type: "integer", minimum: 0 },
        markedQuestionIds: { type: "array", items: { type: "string" } },
      },
    },
  })
  position(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ) {
    return this.attempts.mutate(
      req.learner.id,
      id,
      z
        .object({
          revision,
          currentIndex: z.number().int().min(0).max(199).optional(),
          markedQuestionIds: z.array(z.string().max(100)).max(200).optional(),
        })
        .strict()
        .parse(body),
    );
  }
  @Post("attempts/:id/audio/:unitId")
  @HttpCode(200)
  audio(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("unitId") unitId: string,
    @Body() body: unknown,
  ) {
    return this.attempts.mutate(req.learner.id, id, {
      ...z.object({ revision }).strict().parse(body),
      audioUnit: z.string().max(100).parse(unitId),
    });
  }
  @Post("attempts/:id/submit") @HttpCode(200) submit(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.attempts.submit(req.learner.id, id);
  }
  @Get("attempts/:id/results") result(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.attempts.result(req.learner.id, id);
  }
  @Get("attempts/:id/review") review(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.attempts.review(req.learner.id, id);
  }
  @Get("attempts/:id/feedback/:questionId") feedback(
    @Req() req: LearnerRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("questionId") questionId: string,
  ) {
    return this.attempts.feedback(req.learner.id, id, questionId);
  }
}
