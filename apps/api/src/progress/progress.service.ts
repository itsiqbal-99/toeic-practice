import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  percent,
  type Metric,
  type Overview,
  type Profile,
  type Result,
} from "@toeic/shared";
import { AttemptService } from "../assessments/attempt.service";
import { recommend } from "./insights";
@Injectable()
export class ProgressService {
  constructor(
    @Inject(DataSource) private readonly db: DataSource,
    @Inject(AttemptService) private readonly attempts: AttemptService,
  ) {}
  async history(
    userId: string,
    input: {
      offset: number;
      limit: number;
      mode?: "focused" | "quick" | "mock";
    },
  ) {
    const params = [userId, input.mode ?? null];
    const [{ total }] = await this.db.query(
      "SELECT count(*)::int AS total FROM attempts WHERE user_id=$1 AND status='completed' AND ($2::text IS NULL OR mode=$2)",
      params,
    );
    const rows: { result: Result }[] = await this.db.query(
      "SELECT result FROM attempts WHERE user_id=$1 AND status='completed' AND ($2::text IS NULL OR mode=$2) ORDER BY completed_at DESC,id DESC LIMIT $3 OFFSET $4",
      [...params, input.limit, input.offset],
    );
    return { items: rows.map((r) => r.result), total, ...input };
  }
  async overview(user: Profile): Promise<Overview> {
    const expired = await this.db.query(
      "SELECT id FROM attempts WHERE user_id=$1 AND status='active' AND deadline<=now()",
      [user.id],
    );
    for (const row of expired) await this.attempts.submit(user.id, row.id);
    const rows: { result: Result }[] = await this.db.query(
      "SELECT result FROM attempts WHERE user_id=$1 AND status='completed' ORDER BY completed_at DESC LIMIT 200",
      [user.id],
    );
    const history = rows.map((r) => r.result);
    const totals = await this.db.query(
      `SELECT count(*)::int AS completed,coalesce(sum((result->>'totalQuestions')::int),0)::int AS total,
      coalesce(sum((result->>'correct')::int+(result->>'incorrect')::int),0)::int AS practiced,
      coalesce(sum((result->>'correct')::int),0)::int AS correct FROM attempts WHERE user_id=$1 AND status='completed'`,
      [user.id],
    );
    const metrics: {
      field: string;
      key: string;
      label: string;
      correct: number;
      total: number;
    }[] = await this.db.query(
      `
      SELECT f.field,item->>'key' AS key,item->>'label' AS label,
        sum((item->>'correct')::int)::int AS correct,sum((item->>'total')::int)::int AS total
      FROM attempts a CROSS JOIN (VALUES ('parts'),('sections'),('skills')) AS f(field)
      CROSS JOIN LATERAL jsonb_array_elements(a.result->f.field) item
      WHERE a.user_id=$1 AND a.status='completed' GROUP BY f.field,item->>'key',item->>'label'
      ORDER BY f.field,item->>'key'`,
      [user.id],
    );
    const aggregate = (field: "parts" | "sections" | "skills"): Metric[] => {
      const summary = new Map<string, Metric>();
      for (const m of metrics.filter((m) => m.field === field)) {
        const previous = summary.get(m.key) || {
          key: m.key,
          label: m.label,
          correct: 0,
          total: 0,
          accuracy: 0,
        };
        previous.correct += m.correct;
        previous.total += m.total;
        previous.accuracy = percent(previous.correct, previous.total);
        summary.set(m.key, previous);
      }
      return [...summary.values()];
    };
    const active = await this.db.query(
      `SELECT a.id,a.mode,a.title,a.updated_at AS "updatedAt",count(aq.question_id)::int AS total,
      count(aq.choice_id)::int AS answered FROM attempts a JOIN attempt_questions aq ON aq.attempt_id=a.id
      WHERE a.user_id=$1 AND a.status='active' GROUP BY a.id ORDER BY a.updated_at DESC LIMIT 10`,
      [user.id],
    );
    const preferences = (
      await this.db.query(
        "SELECT goal,weekly_target FROM preferences WHERE user_id=$1",
        [user.id],
      )
    )[0];
    const recent = await this.db.query(
      `SELECT u.part,q.skills,(aq.choice_id=k.choice_id) AS correct FROM attempt_questions aq
      JOIN attempts a ON a.id=aq.attempt_id JOIN questions q ON q.id=aq.question_id JOIN question_units u ON u.id=q.unit_id JOIN answer_keys k ON k.question_id=q.id
      WHERE a.user_id=$1 AND a.status='completed' AND aq.choice_id IS NOT NULL ORDER BY a.completed_at DESC,aq.position LIMIT 50`,
      [user.id],
    );
    const weekly = await this.db.query(
      `SELECT count(*)::int AS n FROM attempt_questions aq JOIN attempts a ON a.id=aq.attempt_id
      WHERE a.user_id=$1 AND a.status='completed' AND a.completed_at>=date_trunc('week',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND aq.choice_id IS NOT NULL`,
      [user.id],
    );
    return {
      user,
      completed: totals[0].completed,
      practiced: totals[0].practiced,
      accuracy: totals[0].total
        ? percent(totals[0].correct, totals[0].total)
        : null,
      sections: aggregate("sections"),
      parts: aggregate("parts"),
      skills: aggregate("skills"),
      active,
      history,
      recommendation: recommend(recent),
      preferences: {
        goal: preferences?.goal ?? null,
        weeklyTarget: preferences?.weekly_target ?? 30,
      },
      weeklyCount: weekly[0].n,
    };
  }
  async preferences(
    userId: string,
    input: { goal: number | null; weeklyTarget: number },
  ) {
    await this.db.query(
      "UPDATE preferences SET goal=$2,weekly_target=$3 WHERE user_id=$1",
      [userId, input.goal, input.weeklyTarget],
    );
    return input;
  }
}
