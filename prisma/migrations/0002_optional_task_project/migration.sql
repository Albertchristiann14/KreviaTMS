-- Make Task.project_id nullable for standalone tasks and set ON DELETE SET NULL
ALTER TABLE "tasks"
  DROP CONSTRAINT IF EXISTS "tasks_project_id_fkey",
  ALTER COLUMN "project_id" DROP NOT NULL,
  ADD CONSTRAINT "tasks_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
