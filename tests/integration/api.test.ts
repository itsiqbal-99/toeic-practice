// @vitest-environment node
import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { INestApplication } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { QUESTION_BANK, generateAttempt, TEST_BLUEPRINT } from "@toeic/content";
import type { Attempt, Overview, Profile, Result } from "@toeic/shared";
import { database } from "../../apps/api/src/database/database";
import { importContent } from "../../apps/api/src/database/content";
import { createApp } from "../../apps/api/src/app";

let pg: PGlite,
  socket: PGLiteSocketServer,
  db: ReturnType<typeof database>,
  app: INestApplication,
  url: string;
const origin = "http://127.0.0.1:3000";
class Browser {
  cookies = new Map<string, string>();
  async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    extra: Record<string, string> = {},
  ) {
    const response = await fetch(url + path, {
      method,
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "X-Toeic-Client": "1",
        Cookie: [...this.cookies].map(([k, v]) => k + "=" + v).join("; "),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const value of response.headers.getSetCookie()) {
      const [entry] = value.split(";"),
        i = entry.indexOf("=");
      this.cookies.set(entry.slice(0, i), entry.slice(i + 1));
    }
    const data = (await response.json().catch(() => null)) as T;
    return { status: response.status, data, headers: response.headers };
  }
}
beforeAll(async () => {
  process.env.DB_POOL_SIZE = "1";
  pg = await PGlite.create();
  socket = new PGLiteSocketServer({ db: pg, port: 0, host: "127.0.0.1" });
  await socket.start();
  db = database(
    "postgresql://postgres:postgres@" + socket.getServerConn() + "/postgres",
  );
  await db.initialize();
  await db.runMigrations();
  await importContent(db);
  app = await createApp(db, true);
  await app.listen(0, "127.0.0.1");
  url = (await app.getUrl()) + "/api/v1";
});
afterAll(async () => {
  vi.restoreAllMocks();
  await app?.close();
  if (db?.isInitialized) await db.destroy();
  await socket?.stop();
  await pg?.close();
});
describe("integrated PostgreSQL API", () => {
  it("imports all content repeatedly without duplicates and preserves versions", async () => {
    expect((await importContent(db)).questions).toBe(150);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM questions"))[0].n,
    ).toBe(150);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM media_references"))[0].n,
    ).toBe(73);
    expect(await db.runMigrations()).toHaveLength(0);
  });
  it("pins old question versions while publishing an updated bank", async () => {
    const b = new Browser();
    await b.request("/auth/me");
    const { data: a } = await b.request<Attempt>("/attempts", "POST", {
      mode: "focused",
      part: "incomplete-sentences",
      count: 1,
    });
    const original = a.contexts[0],
      changed = structuredClone(QUESTION_BANK);
    const unit = changed.find((u) => u.id === original.unit.id)!;
    unit.questions[0].prompt += " Updated content version.";
    try {
      await importContent(db, changed);
      expect(
        (await b.request<Attempt>("/attempts/" + a.id)).data.contexts[0]
          .question.prompt,
      ).toBe(original.question.prompt);
      await b.request(`/attempts/${a.id}/submit`, "POST");
      expect(
        (await b.request<Attempt>(`/attempts/${a.id}/review`)).data.contexts[0]
          .question.prompt,
      ).toBe(original.question.prompt);
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM question_units WHERE original_id=$1",
            [unit.id],
          )
        )[0].n,
      ).toBe(2);
    } finally {
      await importContent(db);
    }
  });
  it("keeps keys, spoken options, image descriptions and transcripts private until submission", async () => {
    const b = new Browser();
    await b.request("/auth/me");
    const started = await b.request<Attempt>("/attempts", "POST", {
      mode: "quick",
      count: 12,
    });
    expect(started.status).toBe(201);
    const a = started.data;
    expect(a.contexts).toHaveLength(12);
    const body = JSON.stringify(a);
    expect(body).not.toContain("correctChoiceId");
    expect(body).not.toContain("explanation");
    expect(body).not.toContain("transcript");
    for (const c of a.contexts.filter((c) => c.unit.part === "photographs")) {
      expect(c.question.choices.map((v) => v.text)).toEqual([
        "Option A",
        "Option B",
        "Option C",
        "Option D",
      ]);
      if (c.unit.stimulus.kind === "image-audio")
        expect(c.unit.stimulus.audio.clips[0].text).toBeUndefined();
    }
    expect((await b.request("/attempts/" + a.id + "/review")).status).toBe(403);
    expect((await b.request("/attempts/" + a.id + "/results")).status).toBe(
      403,
    );
  });
  it("saves answers, position and markers; rejects stale edits and isolates users", async () => {
    const b = new Browser(),
      other = new Browser();
    await b.request("/auth/me");
    await other.request("/auth/me");
    const { data: a } = await b.request<Attempt>("/attempts", "POST", {
      mode: "focused",
      part: "incomplete-sentences",
      count: 5,
    });
    const q = a.contexts[0].question;
    const saved = await b.request<Attempt>(
      `/attempts/${a.id}/answers/${q.id}`,
      "PATCH",
      { revision: a.revision, choiceId: "A" },
    );
    expect(saved.data.answers[q.id]).toBe("A");
    expect(
      (
        await b.request(`/attempts/${a.id}/progress`, "PATCH", {
          revision: 0,
          currentIndex: 1,
        })
      ).status,
    ).toBe(409);
    const moved = await b.request<Attempt>(
      `/attempts/${a.id}/progress`,
      "PATCH",
      {
        revision: saved.data.revision,
        currentIndex: 4,
        markedQuestionIds: [q.id],
      },
    );
    expect(moved.data.currentIndex).toBe(4);
    expect(moved.data.markedQuestionIds).toEqual([q.id]);
    expect(
      (await b.request<Attempt>("/attempts/" + a.id)).data.answers[q.id],
    ).toBe("A");
    for (const suffix of ["", "/results", "/review"])
      expect((await other.request("/attempts/" + a.id + suffix)).status).toBe(
        404,
      );
    expect(
      (await other.request(`/attempts/${a.id}/submit`, "POST")).status,
    ).toBe(404);
  });
  it("scores only stored answers, submits idempotently and freezes finalized answers", async () => {
    const b = new Browser();
    await b.request("/auth/me");
    let { data: a } = await b.request<Attempt>("/attempts", "POST", {
      mode: "focused",
      part: "incomplete-sentences",
      count: 5,
    });
    const q = a.contexts[0].question,
      key = QUESTION_BANK.flatMap((u) => u.questions).find(
        (v) => v.id === q.id,
      )!.correctChoiceId;
    a = (
      await b.request<Attempt>(`/attempts/${a.id}/answers/${q.id}`, "PATCH", {
        revision: a.revision,
        choiceId: key,
      })
    ).data;
    const first = await b.request<Result>(`/attempts/${a.id}/submit`, "POST", {
      score: 100,
      accuracy: 100,
    });
    expect(first.data).toMatchObject({
      correct: 1,
      incorrect: 0,
      unanswered: 4,
      accuracy: 20,
    });
    expect(
      (await b.request<Result>(`/attempts/${a.id}/submit`, "POST")).data,
    ).toEqual(first.data);
    expect(
      (
        await b.request(`/attempts/${a.id}/answers/${q.id}`, "PATCH", {
          revision: a.revision,
          choiceId: "B",
        })
      ).status,
    ).toBe(409);
    expect(
      (await b.request<Attempt>(`/attempts/${a.id}/review`)).data.contexts[0]
        .question.explanation,
    ).toBeTruthy();
    const overview = (await b.request<Overview>("/dashboard/overview")).data;
    expect(overview).toMatchObject({
      completed: 1,
      practiced: 1,
      accuracy: 20,
    });
    expect(overview.recommendation).toBeNull();
    const page = await b.request<{ items: Result[]; total: number }>(
      "/attempts?offset=0&limit=1",
    );
    expect(page.data.total).toBe(1);
    expect(page.data.items).toHaveLength(1);
    expect(
      (await b.request<{ items: Result[] }>("/attempts?offset=1&limit=1")).data
        .items,
    ).toHaveLength(0);
    expect((await b.request("/attempts?limit=101")).status).toBe(400);
    await expect(
      db.query("UPDATE attempt_questions SET marked=true WHERE attempt_id=$1", [
        a.id,
      ]),
    ).rejects.toThrow(/immutable/);
    await expect(
      db.query("UPDATE attempts SET result='{}'::jsonb WHERE id=$1", [a.id]),
    ).rejects.toThrow(/immutable/);
  });
  it("enforces deadline expiry, one-play mock audio and immediate feedback locks", async () => {
    const b = new Browser();
    await b.request("/auth/me");
    const { data: a } = await b.request<Attempt>("/attempts", "POST", {
      mode: "mock",
    });
    expect(a.contexts).toHaveLength(100);
    expect(a.deadline).toBeTruthy();
    const unit = a.contexts[0].unit.id;
    const played = await b.request<Attempt>(
      `/attempts/${a.id}/audio/${unit}`,
      "POST",
      { revision: 0 },
    );
    expect(played.data.audioPlayedUnitIds).toEqual([unit]);
    expect(
      (
        await b.request(`/attempts/${a.id}/audio/${unit}`, "POST", {
          revision: 1,
        })
      ).status,
    ).toBe(409);
    await db.query(
      "UPDATE attempts SET deadline=now()-interval '1 second' WHERE id=$1",
      [a.id],
    );
    expect((await b.request<Attempt>("/attempts/" + a.id)).data.status).toBe(
      "completed",
    );
    expect(
      (await b.request<Result>(`/attempts/${a.id}/results`)).data.unanswered,
    ).toBe(100);
    const { data: p } = await b.request<Attempt>("/attempts", "POST", {
      mode: "focused",
      part: "incomplete-sentences",
      count: 1,
      immediate: true,
    });
    const q = p.contexts[0].question.id;
    expect((await b.request(`/attempts/${p.id}/feedback/${q}`)).status).toBe(
      403,
    );
    await b.request(`/attempts/${p.id}/answers/${q}`, "PATCH", {
      revision: 0,
      choiceId: "A",
    });
    expect((await b.request(`/attempts/${p.id}/feedback/${q}`)).status).toBe(
      200,
    );
    expect(
      (
        await b.request(`/attempts/${p.id}/answers/${q}`, "PATCH", {
          revision: 1,
          choiceId: "B",
        })
      ).status,
    ).toBe(409);
  });
  it("validates trust boundaries, rejects CSRF, revokes logout and expires sessions", async () => {
    const b = new Browser(),
      old = (await b.request<Profile>("/auth/me")).data;
    expect(
      (await b.request("/attempts", "POST", { mode: "mock", count: 200 }))
        .status,
    ).toBe(400);
    expect(
      (
        await b.request("/attempts", "POST", {
          mode: "focused",
          part: "short-conversations",
          count: 1,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await b.request(
          "/attempts",
          "POST",
          { mode: "quick" },
          { Origin: "https://attacker.invalid" },
        )
      ).status,
    ).toBe(403);
    expect((await b.request("/attempts/not-a-uuid")).status).toBe(400);
    await b.request("/auth/logout", "POST");
    expect((await b.request<Profile>("/auth/me")).data.id).not.toBe(old.id);
    const before = (await b.request<Profile>("/auth/me")).data;
    await db.query(
      "UPDATE app_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",
      [before.id],
    );
    expect((await b.request<Profile>("/auth/me")).data.id).not.toBe(before.id);
  });
  it("imports legacy data once with consent and recomputes its score", async () => {
    const b = new Browser();
    await b.request("/auth/me");
    const generated = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "legacy");
    const record = {
      kind: "result",
      data: {
        ...generated,
        schemaVersion: 1,
        attemptId: "legacy-1",
        answers: {},
        completedAt: "2026-01-01T00:00:00.000Z",
        estimatedScore: 990,
        correct: 100,
      },
    };
    const first = await b.request<Attempt>("/attempts/import", "POST", record);
    expect(first.status).toBe(201);
    const result = (
      await b.request<Result>(`/attempts/${first.data.id}/results`)
    ).data;
    expect(result).toMatchObject({ correct: 0, accuracy: 0, imported: true });
    expect(
      (await b.request<Attempt>("/attempts/import", "POST", record)).data.id,
    ).toBe(first.data.id);
    expect(
      (
        await b.request("/attempts/import", "POST", {
          ...record,
          data: { ...record.data, answers: { "not-a-question": "A" } },
        })
      ).status,
    ).toBe(400);
  });
  it("validates OAuth state, PKCE and nonce; recognizes accounts and merges only with consent", async () => {
    process.env.GOOGLE_CLIENT_ID = "test-client";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
    process.env.GOOGLE_CALLBACK_URL = origin + "/api/v1/auth/google/callback";
    const b = new Browser(),
      guest = (await b.request<Profile>("/auth/me")).data;
    await b.request("/attempts", "POST", {
      mode: "focused",
      part: "incomplete-sentences",
      count: 1,
    });
    const begin = await b.request("/auth/google");
    const redirect = new URL(begin.headers.get("location")!);
    expect(redirect.searchParams.get("code_challenge_method")).toBe("S256");
    expect(redirect.searchParams.get("scope")).toBe("openid email profile");
    expect(
      (
        await b.request("/auth/google/callback?state=invalid&code=code")
      ).headers.get("location"),
    ).toContain("signin=failed");
    const state = redirect.searchParams.get("state")!,
      nonce = redirect.searchParams.get("nonce")!;
    expect(nonce).toBeTruthy();
    expect((await db.query("SELECT nonce FROM oauth_states"))[0].nonce).toBe(
      nonce,
    );
    const token = vi
      .spyOn(OAuth2Client.prototype, "getToken")
      .mockResolvedValue({ tokens: { id_token: "mock" } } as never);
    const verify = vi
      .spyOn(OAuth2Client.prototype, "verifyIdToken")
      .mockResolvedValue({
        getPayload: () => ({
          sub: "stable-subject",
          name: "Test learner",
          email: "learner@example.test",
          email_verified: true,
          nonce,
        }),
      } as never);
    const callback = await b.request(
      "/auth/google/callback?state=" + state + "&code=code",
    );
    expect(callback.status, JSON.stringify(callback.data)).toBe(302);
    expect(token).toHaveBeenCalledWith(
      expect.objectContaining({ codeVerifier: expect.any(String) }),
    );
    const user = (await b.request<Profile>("/auth/me")).data;
    expect(user).toMatchObject({ guest: false, mergeCount: 1 });
    expect(user.id).not.toBe(guest.id);
    expect(
      (await b.request<Overview>("/dashboard/overview")).data.active,
    ).toHaveLength(0);
    await b.request("/auth/merge-guest", "POST");
    expect(
      (await b.request<Overview>("/dashboard/overview")).data.active,
    ).toHaveLength(1);
    expect(
      (
        await b.request("/auth/google/callback?state=" + state + "&code=code")
      ).headers.get("location"),
    ).toContain("signin=failed");
    const b2 = new Browser();
    await b2.request("/auth/me");
    const again = await b2.request("/auth/google"),
      r = new URL(again.headers.get("location")!);
    verify.mockResolvedValue({
      getPayload: () => ({
        sub: "stable-subject",
        email: "learner@example.test",
        email_verified: true,
        nonce: r.searchParams.get("nonce"),
      }),
    } as never);
    await b2.request(
      "/auth/google/callback?state=" +
        r.searchParams.get("state") +
        "&code=code",
    );
    expect((await b2.request<Profile>("/auth/me")).data.id).toBe(user.id);
    const failed = new Browser();
    const failedGuest = (await failed.request<Profile>("/auth/me")).data;
    const invalidFlow = new URL(
      (await failed.request("/auth/google")).headers.get("location")!,
    );
    verify.mockResolvedValue({
      getPayload: () => ({
        sub: "wrong",
        email_verified: true,
        nonce: "wrong-nonce",
      }),
    } as never);
    expect(
      (
        await failed.request(
          "/auth/google/callback?state=" +
            invalidFlow.searchParams.get("state") +
            "&code=code",
        )
      ).headers.get("location"),
    ).toContain("signin=failed");
    expect((await failed.request<Profile>("/auth/me")).data.id).toBe(
      failedGuest.id,
    );
    token.mockRestore();
    verify.mockRestore();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK_URL;
  });
});
