import { pgTable, text, timestamp, json, index } from "drizzle-orm/pg-core";
import { cxSession } from "./cx-session";
import { repository } from "./repositories";
import { user } from "./better-auth-schema";

export const repositoryAccessLog = pgTable(
  "repository_access_logs",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => cxSession.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    openStartDt: timestamp("open_start_dt"),
    openConfirmDt: timestamp("open_confirm_dt"),
    closeStartDt: timestamp("close_start_dt"),
    closeConfirmDt: timestamp("close_confirm_dt"),
    releaseDt: timestamp("release_dt"),
    authorizedUsers: json("authorized_users").$type<string[]>().default([]),
  },
  (table) => ({
    sessionIdIdx: index("index_repository_access_logs_on_session_id").on(
      table.sessionId
    ),
    repositoryIdIdx: index("index_repository_access_logs_on_repository_id").on(
      table.repositoryId
    ),
    userIdIdx: index("index_repository_access_logs_on_user_id").on(
      table.userId
    ),
  })
);
