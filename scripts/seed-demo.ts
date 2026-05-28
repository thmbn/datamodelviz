// Builds examples/demo.sqlite — a small 4-table blog schema with dummy data.
// Schema: users 1—* posts *—* tags (via post_tags), plus comments (* — 1 posts, * — 1 users).
import Database from "better-sqlite3";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve("examples/demo.sqlite");
if (existsSync(dbPath)) unlinkSync(dbPath);

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  display_name TEXT   NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id    INTEGER NOT NULL REFERENCES users(id),
  title        TEXT    NOT NULL,
  body         TEXT,
  published_at TEXT,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_posts_author ON posts(author_id);

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE,
  color TEXT
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id),
  tag_id  INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id),
  author_id  INTEGER NOT NULL REFERENCES users(id),
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_post ON comments(post_id);
`);

const insertUser = db.prepare(
  "INSERT INTO users (email, display_name) VALUES (?, ?)"
);
const insertPost = db.prepare(
  "INSERT INTO posts (author_id, title, body, published_at) VALUES (?, ?, ?, ?)"
);
const insertTag = db.prepare("INSERT INTO tags (name, color) VALUES (?, ?)");
const insertPostTag = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
const insertComment = db.prepare(
  "INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)"
);

db.transaction(() => {
  const ada = insertUser.run("ada@example.com", "Ada Lovelace").lastInsertRowid as number;
  const grace = insertUser.run("grace@example.com", "Grace Hopper").lastInsertRowid as number;
  const linus = insertUser.run("linus@example.com", "Linus Torvalds").lastInsertRowid as number;

  const p1 = insertPost.run(ada, "On the Analytical Engine", "Notes G.", "2026-05-01").lastInsertRowid as number;
  const p2 = insertPost.run(grace, "Why we need compilers", "Hopper essay", "2026-05-10").lastInsertRowid as number;
  const p3 = insertPost.run(linus, "Talk is cheap", "Show me the code.", "2026-05-15").lastInsertRowid as number;

  const tHistory = insertTag.run("history", "#888").lastInsertRowid as number;
  const tCompilers = insertTag.run("compilers", "#08f").lastInsertRowid as number;
  const tKernel = insertTag.run("kernel", "#f80").lastInsertRowid as number;

  insertPostTag.run(p1, tHistory);
  insertPostTag.run(p2, tCompilers);
  insertPostTag.run(p2, tHistory);
  insertPostTag.run(p3, tKernel);

  insertComment.run(p1, grace, "Brilliant — see also my 1952 paper.");
  insertComment.run(p2, ada, "Could a compiler emit machine code for the AE?");
  insertComment.run(p3, ada, "Cheaper still: a well-formed proof.");
})();

console.error(`seeded ${dbPath}`);
db.close();
