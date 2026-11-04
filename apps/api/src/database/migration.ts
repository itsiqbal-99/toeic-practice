import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793664000000 implements MigrationInterface {
  name = "InitialSchema1793664000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY, name text NOT NULL, email text, avatar text, is_guest boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE oauth_identities (
        provider text NOT NULL, subject text NOT NULL, user_id uuid NOT NULL REFERENCES users(id),
        PRIMARY KEY(provider, subject), UNIQUE(provider, user_id)
      );
      CREATE TABLE preferences (
        user_id uuid PRIMARY KEY REFERENCES users(id), goal integer CHECK(goal BETWEEN 1 AND 100),
        weekly_target integer NOT NULL DEFAULT 30 CHECK(weekly_target BETWEEN 5 AND 500)
      );
      CREATE TABLE app_sessions (
        token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), merge_from uuid REFERENCES users(id),
        expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_expiry ON app_sessions(expires_at);
      CREATE TABLE oauth_states (
        state_hash text PRIMARY KEY, verifier text NOT NULL, nonce text NOT NULL, session_hash text NOT NULL,
        expires_at timestamptz NOT NULL
      );
      CREATE TABLE question_units (
        id uuid PRIMARY KEY, original_id text NOT NULL, version text NOT NULL, section text NOT NULL, part text NOT NULL,
        instruction text NOT NULL, stimulus jsonb NOT NULL, current boolean NOT NULL DEFAULT true,
        UNIQUE(original_id, version)
      );
      CREATE UNIQUE INDEX current_unit ON question_units(original_id) WHERE current;
      CREATE TABLE questions (
        id uuid PRIMARY KEY, unit_id uuid NOT NULL REFERENCES question_units(id), original_id text NOT NULL,
        position integer NOT NULL, prompt text NOT NULL, difficulty text NOT NULL, skills text[] NOT NULL,
        UNIQUE(unit_id, original_id), UNIQUE(unit_id, position)
      );
      CREATE TABLE choices (
        question_id uuid NOT NULL REFERENCES questions(id), choice_id text NOT NULL CHECK(choice_id IN ('A','B','C','D')),
        text text NOT NULL, PRIMARY KEY(question_id, choice_id)
      );
      CREATE TABLE answer_keys (
        question_id uuid PRIMARY KEY REFERENCES questions(id), choice_id text NOT NULL, explanation text NOT NULL,
        FOREIGN KEY(question_id, choice_id) REFERENCES choices(question_id, choice_id)
      );
      CREATE TABLE media_references (
        unit_id uuid NOT NULL REFERENCES question_units(id), source text NOT NULL, kind text NOT NULL,
        PRIMARY KEY(unit_id, source)
      );
      CREATE TABLE blueprints (
        id text NOT NULL, version integer NOT NULL, title text NOT NULL, definition jsonb NOT NULL,
        PRIMARY KEY(id, version)
      );
      CREATE TABLE attempts (
        id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), mode text NOT NULL CHECK(mode IN ('focused','quick','mock')),
        title text NOT NULL, blueprint_id text NOT NULL, blueprint_version integer NOT NULL DEFAULT 1,
        status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')), revision integer NOT NULL DEFAULT 0,
        current_index integer NOT NULL DEFAULT 0, immediate boolean NOT NULL DEFAULT false, audio_played text[] NOT NULL DEFAULT '{}',
        started_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deadline timestamptz,
        completed_at timestamptz, result jsonb, imported_key text,
        FOREIGN KEY(blueprint_id, blueprint_version) REFERENCES blueprints(id, version), UNIQUE(user_id, imported_key)
      );
      CREATE INDEX attempts_owner_status ON attempts(user_id, status, updated_at DESC);
      CREATE TABLE attempt_questions (
        attempt_id uuid NOT NULL REFERENCES attempts(id), question_id uuid NOT NULL REFERENCES questions(id),
        position integer NOT NULL, choice_id text, marked boolean NOT NULL DEFAULT false,
        PRIMARY KEY(attempt_id, question_id), UNIQUE(attempt_id, position),
        FOREIGN KEY(question_id, choice_id) REFERENCES choices(question_id, choice_id)
      );
      CREATE INDEX attempt_question_history ON attempt_questions(question_id, attempt_id);
      CREATE FUNCTION protect_final_result() RETURNS trigger AS $$
      BEGIN
        IF OLD.status = 'completed' AND
          (NEW.result IS DISTINCT FROM OLD.result OR NEW.status IS DISTINCT FROM OLD.status OR NEW.completed_at IS DISTINCT FROM OLD.completed_at) THEN
          RAISE EXCEPTION 'Finalized results are immutable';
        END IF;
        RETURN NEW;
      END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER immutable_result BEFORE UPDATE ON attempts FOR EACH ROW EXECUTE FUNCTION protect_final_result();
      CREATE FUNCTION protect_final_answers() RETURNS trigger AS $$
      BEGIN
        IF EXISTS (SELECT 1 FROM attempts WHERE id = OLD.attempt_id AND status = 'completed') THEN
          RAISE EXCEPTION 'Finalized answers are immutable';
        END IF;
        RETURN NEW;
      END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER immutable_answers BEFORE UPDATE ON attempt_questions FOR EACH ROW EXECUTE FUNCTION protect_final_answers();
    `);
  }
  async down(): Promise<void> {
    throw new Error(
      "Destructive rollback is intentionally unavailable. Restore a verified database backup instead.",
    );
  }
}
