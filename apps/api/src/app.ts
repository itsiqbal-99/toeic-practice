import "reflect-metadata";
import {
  Module,
  Catch,
  HttpException,
  type ExceptionFilter,
  type ArgumentsHost,
  Logger,
  ConsoleLogger,
  Inject,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { ZodError } from "zod";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";
import { ApiController } from "./api.controller";
import { AuthService } from "./auth/auth.service";
import { AttemptService } from "./assessments/attempt.service";
import { ProgressService } from "./progress/progress.service";
@Catch()
class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      error instanceof ZodError
        ? 400
        : error instanceof HttpException
          ? error.getStatus()
          : 500;
    const message =
      error instanceof ZodError
        ? error.issues.map((i) => i.message).join(" ")
        : error instanceof HttpException
          ? error.message
          : "The server could not complete this request.";
    if (status === 500)
      Logger.error(
        error instanceof Error ? error.message : "Unexpected error",
        "API",
      );
    res.status(status).json({ error: { status, message } });
  }
}
@Module({})
class AppModule {
  constructor(@Inject(DataSource) private readonly db:DataSource) {}
  async onApplicationShutdown(){if(this.db.isInitialized)await this.db.destroy();}
}
export async function createApp(db: DataSource, quiet = false) {
  const app = await NestFactory.create(
    {
      module: AppModule,
      controllers: [ApiController],
      providers: [
        { provide: DataSource, useValue: db },
        AuthService,
        AttemptService,
        ProgressService,
      ],
    },
    { logger: quiet ? false : new ConsoleLogger({ json: true }) },
  );
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new Errors());
  const auth = app.get(AuthService);
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    if (["/api/v1/health", "/api/v1/ready"].includes(req.path)) return next();
    if (!req.path.startsWith("/api/v1/")) return next();
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (
        req.headers.origin !==
          (process.env.WEB_ORIGIN || "http://127.0.0.1:3000") ||
        req.headers["x-toeic-client"] !== "1"
      ) {
        return res.status(403).json({
          error: {
            status: 403,
            message: "This request must come from the application.",
          },
        });
      }
    }
    try {
      const session = await auth.session(req, res);
      Object.assign(req, {
        learner: session.user,
        sessionHash: session.sessionHash,
      });
      next();
    } catch {
      res.status(503).json({
        error: {
          status: 503,
          message: "Your session could not be restored. Please retry.",
        },
      });
    }
  });
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("TOEIC Practice API")
      .setVersion("1")
      .addCookieAuth("toeic_session")
      .build(),
  );
  SwaggerModule.setup("api/docs", app, document);
  return app;
}
