import type { MigrationInterface, QueryRunner } from "typeorm";
export class Integrity1793750400000 implements MigrationInterface {
  name = "Integrity1793750400000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      DELETE FROM oauth_states WHERE expires_at<=now() OR NOT EXISTS(SELECT 1 FROM app_sessions WHERE token_hash=oauth_states.session_hash);
      ALTER TABLE oauth_states ADD CONSTRAINT oauth_session FOREIGN KEY(session_hash) REFERENCES app_sessions(token_hash) ON DELETE CASCADE;
      ALTER TABLE attempts ADD CONSTRAINT attempt_state CHECK(
        revision>=0 AND current_index>=0 AND
        ((status='active' AND result IS NULL AND completed_at IS NULL) OR
         (status='completed' AND result IS NOT NULL AND completed_at IS NOT NULL))
      );
      CREATE OR REPLACE FUNCTION protect_final_answers() RETURNS trigger AS $$
      DECLARE target uuid;
      BEGIN
        target := CASE WHEN TG_OP='DELETE' THEN OLD.attempt_id ELSE NEW.attempt_id END;
        IF EXISTS(SELECT 1 FROM attempts WHERE id=target AND status='completed') OR
           (TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM attempts WHERE id=OLD.attempt_id AND status='completed')) THEN
          RAISE EXCEPTION 'Finalized answers are immutable';
        END IF;
        IF TG_OP='DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
      END; $$ LANGUAGE plpgsql;
      DROP TRIGGER immutable_answers ON attempt_questions;
      CREATE TRIGGER immutable_answers BEFORE INSERT OR UPDATE OR DELETE ON attempt_questions FOR EACH ROW EXECUTE FUNCTION protect_final_answers();
    `);
  }
  async down(): Promise<void> {
    throw new Error(
      "Restore a verified backup to roll back integrity constraints.",
    );
  }
}
