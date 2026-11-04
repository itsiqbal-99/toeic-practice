import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import { randomUUID } from "node:crypto";
import { type QuestionUnit } from "@toeic/content";
import {
  PARTS,
  type Attempt,
  type ChoiceId,
  type Context,
  type StartInput,
  type Result,
  type Catalog,
  type Mode,
} from "@toeic/shared";
import {
  selectQuestions,
  publicContexts,
  score,
  reachableCounts,
  filterUnits,
} from "./engine";
import { validateLegacy, type LegacyInput } from "./legacy";

interface AttemptRow {
  id: string;
  user_id: string;
  mode: Mode;
  title: string;
  status: "active" | "completed";
  revision: number;
  current_index: number;
  immediate: boolean;
  audio_played: string[];
  started_at: Date;
  updated_at: Date;
  deadline: Date | null;
  completed_at: Date | null;
  result: Result | null;
}
interface ContentRow {
  id: string;
  original_id: string;
  unit_id: string;
  unit_original_id: string;
  section: "listening" | "reading";
  part: keyof typeof PARTS;
  instruction: string;
  stimulus: Context["unit"]["stimulus"];
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  skills: string[];
  choices: Context["question"]["choices"];
  correct_choice_id: ChoiceId;
  explanation: string;
  position: number;
  choice_id: ChoiceId | null;
  marked: boolean;
}
const contentSql = `SELECT q.*, u.original_id AS unit_original_id,u.section,u.part,u.instruction,u.stimulus,
  k.choice_id AS correct_choice_id,k.explanation,
  (SELECT jsonb_agg(jsonb_build_object('id',c.choice_id,'text',c.text) ORDER BY c.choice_id) FROM choices c WHERE c.question_id=q.id) AS choices
  FROM questions q JOIN question_units u ON u.id=q.unit_id JOIN answer_keys k ON k.question_id=q.id`;
@Injectable()
export class AttemptService {
  constructor(@Inject(DataSource) private readonly db: DataSource) {}
  async rows(manager: EntityManager = this.db.manager): Promise<ContentRow[]> {
    return manager.query(
      contentSql + " WHERE u.current ORDER BY u.original_id,q.position",
    );
  }
  units(rows: ContentRow[]): QuestionUnit[] {
    const units = new Map<string, QuestionUnit>();
    for (const r of rows) {
      let unit = units.get(r.unit_id);
      if (!unit) {
        unit = {
          id: r.unit_original_id,
          part: r.part,
          section: r.section,
          instruction: r.instruction,
          stimulus: r.stimulus as QuestionUnit["stimulus"],
          questions: [],
        };
        units.set(r.unit_id, unit);
      }
      unit.questions.push({
        id: r.original_id,
        prompt: r.prompt,
        choices: r.choices,
        correctChoiceId: r.correct_choice_id,
        explanation: r.explanation,
        difficulty: r.difficulty,
        skills: r.skills as QuestionUnit["questions"][number]["skills"],
      });
    }
    return [...units.values()];
  }
  async catalog(
    userId: string,
    filters: Pick<StartInput, "difficulty" | "replay" | "skill"> = {},
  ): Promise<Catalog> {
    const bank = this.units(await this.rows());
    const units = filterUnits(
      bank,
      filters,
      filters.replay ? await this.mistakes(userId) : [],
    );
    const supports = (input: StartInput) => {
      try {
        selectQuestions(bank, input, "availability");
        return true;
      } catch {
        return false;
      }
    };
    return {
      parts: Object.entries(PARTS).map(([id, p]) => {
        const available = units.filter((u) => u.part === id);
        return {
          id: id as keyof typeof PARTS,
          ...p,
          count: available.flatMap((u) => u.questions).length,
          counts: reachableCounts(available),
          difficulties: [
            ...new Set(
              available.flatMap((u) => u.questions.map((q) => q.difficulty)),
            ),
          ],
        };
      }),
      blueprints: [
        {
          id: "quick-12",
          title: "Quick test",
          mode: "quick",
          available: supports({ mode: "quick", count: 12 }),
          count: 12,
          minutes: 12,
        },
        {
          id: "quick-24",
          title: "Quick test",
          mode: "quick",
          available: supports({ mode: "quick", count: 24 }),
          count: 24,
          minutes: 24,
        },
        {
          id: "mock-100",
          title: "Shortened mock",
          mode: "mock",
          available: supports({ mode: "mock" }),
          count: 100,
          minutes: 60,
        },
        {
          id: "full-200",
          title: "Full-format simulation",
          mode: "mock",
          available: false,
          count: 200,
          minutes: 120,
          reason:
            "This 150-question bank cannot meet the full 200-question quotas. No questions will be duplicated.",
        },
      ],
    };
  }
  async mistakes(userId: string): Promise<string[]> {
    const rows = await this.db.query(
      `SELECT DISTINCT ON(q.original_id) q.original_id,aq.choice_id,k.choice_id AS correct
      FROM attempt_questions aq JOIN attempts a ON a.id=aq.attempt_id JOIN questions q ON q.id=aq.question_id JOIN answer_keys k ON k.question_id=q.id
      WHERE a.user_id=$1 AND a.status='completed' AND aq.choice_id IS NOT NULL ORDER BY q.original_id,a.completed_at DESC`,
      [userId],
    );
    return rows
      .filter(
        (r: { choice_id: string; correct: string }) =>
          r.choice_id !== r.correct,
      )
      .map((r: { original_id: string }) => r.original_id);
  }
  async start(userId: string, input: StartInput): Promise<Attempt> {
    const rows = await this.rows(),
      bank = this.units(rows),
      id = randomUUID();
    const selected = selectQuestions(
      bank,
      input,
      id,
      input.replay ? await this.mistakes(userId) : [],
    );
    const minutes =
      input.mode === "mock"
        ? 60
        : input.timed
          ? selected.orderedQuestionIds.length
          : null;
    await this.db.transaction(async (m) => {
      await m.query(
        `INSERT INTO attempts(id,user_id,mode,title,blueprint_id,immediate,deadline)
        VALUES($1,$2,$3,$4,$3,$5,CASE WHEN $6::int IS NULL THEN NULL ELSE now()+$6*interval '1 minute' END)`,
        [
          id,
          userId,
          input.mode,
          selected.title,
          input.mode === "focused" && Boolean(input.immediate),
          minutes,
        ],
      );
      for (const [
        position,
        originalId,
      ] of selected.orderedQuestionIds.entries()) {
        const question = rows.find((r) => r.original_id === originalId)!;
        await m.query(
          "INSERT INTO attempt_questions(attempt_id,question_id,position) VALUES($1,$2,$3)",
          [id, question.id, position],
        );
      }
    });
    return this.get(userId, id);
  }
  async importLegacy(userId: string, input: LegacyInput): Promise<Attempt> {
    const rows = await this.rows();
    validateLegacy(input, this.units(rows));
    const d = input.data,
      key = input.kind + ":" + (input.kind === "active" ? d.id : d.attemptId);
    const id = await this.db.transaction(async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        userId + key,
      ]);
      const previous = await m.query(
        "SELECT id FROM attempts WHERE user_id=$1 AND imported_key=$2",
        [userId, key],
      );
      if (previous[0]) return previous[0].id as string;
      const id = randomUUID();
      await m.query(
        "INSERT INTO attempts(id,user_id,mode,title,blueprint_id,imported_key,current_index) VALUES($1,$2,'quick',$3,'legacy',$4,$5)",
        [
          id,
          userId,
          input.kind === "active"
            ? "Imported unfinished practice"
            : "Imported 100-question practice",
          key,
          d.currentIndex,
        ],
      );
      for (const [position, originalId] of d.orderedQuestionIds.entries()) {
        const q = rows.find((r) => r.original_id === originalId)!;
        await m.query(
          "INSERT INTO attempt_questions(attempt_id,question_id,position,choice_id,marked) VALUES($1,$2,$3,$4,$5)",
          [
            id,
            q.id,
            position,
            d.answers[originalId] || null,
            d.markedQuestionIds.includes(originalId),
          ],
        );
      }
      if (input.kind === "result") {
        const a = await this.owned(m, userId, id),
          data = await this.contexts(m, id),
          completedAt = new Date(d.completedAt!);
        const result = {
          ...score(data.contexts, data.answers, {
            id,
            mode: "quick",
            title: a.title,
            startedAt: completedAt,
            completedAt,
          }),
          imported: true,
        };
        await m.query(
          "UPDATE attempts SET started_at=$2,completed_at=$2,updated_at=$2,status='completed',result=$3 WHERE id=$1",
          [id, completedAt, JSON.stringify(result)],
        );
      }
      return id;
    });
    return this.get(userId, id);
  }
  async owned(
    m: EntityManager,
    userId: string,
    id: string,
    lock = false,
  ): Promise<AttemptRow> {
    const rows = await m.query(
      "SELECT * FROM attempts WHERE id=$1 AND user_id=$2" +
        (lock ? " FOR UPDATE" : ""),
      [id, userId],
    );
    if (!rows[0])
      throw new NotFoundException(
        "This attempt was not found in your account.",
      );
    return rows[0];
  }
  async contexts(
    m: EntityManager,
    id: string,
  ): Promise<{
    contexts: Context[];
    answers: Record<string, ChoiceId>;
    marked: string[];
  }> {
    const rows: ContentRow[] = await m.query(
      `SELECT content.*,aq.position,aq.choice_id,aq.marked FROM (${contentSql}) content
      JOIN attempt_questions aq ON aq.question_id=content.id WHERE aq.attempt_id=$1 ORDER BY aq.position`,
      [id],
    );
    const units = this.units(rows);
    return {
      contexts: rows.map((r, index) => {
        const unit = units.find((u) => u.id === r.unit_original_id)!;
        return {
          unit,
          question: unit.questions.find((q) => q.id === r.original_id)!,
          index,
        };
      }),
      answers: Object.fromEntries(
        rows
          .filter((r) => r.choice_id)
          .map((r) => [r.original_id, r.choice_id!]),
      ),
      marked: rows.filter((r) => r.marked).map((r) => r.original_id),
    };
  }
  async finalize(m: EntityManager, a: AttemptRow): Promise<Result> {
    if (a.result) return a.result;
    const data = await this.contexts(m, a.id);
    const [{ now }]: { now: Date }[] = await m.query(
      "SELECT clock_timestamp() AS now",
    );
    const completedAt =
      a.deadline && +new Date(a.deadline) < +now ? new Date(a.deadline) : now;
    const result = score(data.contexts, data.answers, {
      id: a.id,
      mode: a.mode,
      title: a.title,
      startedAt: new Date(a.started_at),
      completedAt,
      immediate: a.immediate,
      timed: Boolean(a.deadline),
    });
    await m.query(
      "UPDATE attempts SET status='completed',completed_at=$2,updated_at=$2,result=$3,revision=revision+1 WHERE id=$1",
      [a.id, completedAt, JSON.stringify(result)],
    );
    return result;
  }
  async get(userId: string, id: string): Promise<Attempt> {
    return this.db.transaction(async (m) => {
      const a = await this.owned(m, userId, id, true);
      if (
        a.status === "active" &&
        a.deadline &&
        +new Date(a.deadline) <= Date.now()
      ) {
        await this.finalize(m, a);
        a.status = "completed";
        a.revision++;
      }
      const data = await this.contexts(m, id);
      return {
        id: a.id,
        mode: a.mode,
        title: a.title,
        status: a.status,
        revision: a.revision,
        currentIndex: a.current_index,
        immediate: a.immediate,
        audioPlayedUnitIds: a.audio_played,
        startedAt: new Date(a.started_at).toISOString(),
        updatedAt: new Date(a.updated_at).toISOString(),
        deadline: a.deadline ? new Date(a.deadline).toISOString() : null,
        serverNow: new Date().toISOString(),
        contexts: publicContexts(data.contexts),
        answers: data.answers,
        markedQuestionIds: data.marked,
      };
    });
  }
  async mutate(
    userId: string,
    id: string,
    input: {
      revision: number;
      questionId?: string;
      choiceId?: ChoiceId;
      currentIndex?: number;
      markedQuestionIds?: string[];
      audioUnit?: string;
    },
  ): Promise<Attempt> {
    let expired = false;
    await this.db.transaction(async (m) => {
      const a = await this.owned(m, userId, id, true);
      if (a.status !== "active")
        throw new ConflictException("This attempt has already been submitted.");
      if (a.deadline && +new Date(a.deadline) <= Date.now()) {
        await this.finalize(m, a);
        expired = true;
        return;
      }
      if (a.revision !== input.revision)
        throw new ConflictException(
          "This attempt changed in another tab or device. Reload it before continuing.",
        );
      const data = await this.contexts(m, id);
      if (input.questionId) {
        const context = data.contexts.find(
          (c) => c.question.id === input.questionId,
        );
        if (
          !context ||
          !context.question.choices.some((c) => c.id === input.choiceId)
        )
          throw new BadRequestException(
            "Choose a valid answer in this attempt.",
          );
        if (a.immediate && data.answers[input.questionId])
          throw new ConflictException(
            "An answer with immediate feedback cannot be changed.",
          );
        await m.query(
          "UPDATE attempt_questions SET choice_id=$3 WHERE attempt_id=$1 AND question_id=(SELECT q.id FROM questions q JOIN attempt_questions aq ON aq.question_id=q.id WHERE aq.attempt_id=$1 AND q.original_id=$2)",
          [id, input.questionId, input.choiceId],
        );
      }
      if (
        input.currentIndex !== undefined &&
        input.currentIndex >= data.contexts.length
      )
        throw new BadRequestException(
          "Question position is outside this attempt.",
        );
      if (input.markedQuestionIds) {
        if (
          input.markedQuestionIds.some(
            (q) => !data.contexts.some((c) => c.question.id === q),
          )
        )
          throw new BadRequestException(
            "A review marker does not belong to this attempt.",
          );
        await m.query(
          "UPDATE attempt_questions SET marked=(question_id IN(SELECT id FROM questions WHERE original_id=ANY($2::text[]))) WHERE attempt_id=$1",
          [id, input.markedQuestionIds],
        );
      }
      if (input.audioUnit) {
        const unit = data.contexts.find(
          (c) => c.unit.id === input.audioUnit,
        )?.unit;
        if (!unit || unit.section !== "listening")
          throw new BadRequestException(
            "This audio does not belong to the attempt.",
          );
        if (a.mode === "mock" && a.audio_played.includes(input.audioUnit))
          throw new ConflictException(
            "This audio has already been played in the mock.",
          );
      }
      await m.query(
        `UPDATE attempts SET revision=revision+1,updated_at=now(),current_index=COALESCE($2,current_index),
        audio_played=CASE WHEN $3::text IS NULL THEN audio_played ELSE array_append(audio_played,$3) END WHERE id=$1`,
        [id, input.currentIndex ?? null, input.audioUnit ?? null],
      );
    });
    if (expired)
      throw new ConflictException(
        "Time expired. Your saved answers have been submitted.",
      );
    return this.get(userId, id);
  }
  async submit(userId: string, id: string): Promise<Result> {
    return this.db.transaction(async (m) =>
      this.finalize(m, await this.owned(m, userId, id, true)),
    );
  }
  async result(userId: string, id: string): Promise<Result> {
    await this.get(userId, id);
    const a = await this.owned(this.db.manager, userId, id);
    if (!a.result)
      throw new ForbiddenException("Submit this attempt to see its results.");
    return a.result;
  }
  async review(userId: string, id: string): Promise<Attempt> {
    await this.result(userId, id);
    const a = await this.get(userId, id),
      data = await this.contexts(this.db.manager, id);
    return { ...a, contexts: publicContexts(data.contexts, true) };
  }
  async feedback(userId: string, id: string, questionId: string) {
    const a = await this.owned(this.db.manager, userId, id),
      data = await this.contexts(this.db.manager, id);
    if (!a.immediate || a.mode !== "focused" || !data.answers[questionId])
      throw new ForbiddenException(
        "Feedback is available after answering in immediate practice.",
      );
    const context = data.contexts.find((c) => c.question.id === questionId);
    if (!context) throw new NotFoundException();
    return {
      correctChoiceId: context.question.correctChoiceId,
      explanation: context.question.explanation,
    };
  }
}
