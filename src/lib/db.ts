import type { D1Database } from "@cloudflare/workers-types";

export interface Post {
  slug: string;
  title: string;
  description: string;
  content: string;
  draft: number;
  created_at: string;
  updated_at: string;
}

export interface PostInput {
  slug: string;
  title: string;
  description: string;
  content: string;
  draft: boolean;
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    content: row.content as string,
    draft: row.draft as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPosts(db: D1Database, includeDrafts = false) {
  if (includeDrafts) {
    const { results } = await db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    return results.map(rowToPost);
  }
  const { results } = await db.prepare("SELECT * FROM posts WHERE draft = 0 ORDER BY created_at DESC").all();
  return results.map(rowToPost);
}

export async function getPostBySlug(db: D1Database, slug: string, includeDrafts = false) {
  const result = includeDrafts
    ? await db.prepare("SELECT * FROM posts WHERE slug = ?").bind(slug).first()
    : await db.prepare("SELECT * FROM posts WHERE slug = ? AND draft = 0").bind(slug).first();
  return result ? rowToPost(result as Record<string, unknown>) : null;
}

export async function createPost(db: D1Database, input: PostInput) {
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO posts (slug, title, description, content, draft, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)")
    .bind(input.slug, input.title, input.description, input.content, input.draft ? 1 : 0, now, now)
    .run();
  return getPostBySlug(db, input.slug, true);
}

export async function updatePost(db: D1Database, currentSlug: string, input: Partial<PostInput>) {
  const now = new Date().toISOString();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (input.title !== undefined) { sets.push("title = ?"); vals.push(input.title); }
  if (input.description !== undefined) { sets.push("description = ?"); vals.push(input.description); }
  if (input.content !== undefined) { sets.push("content = ?"); vals.push(input.content); }
  if (input.draft !== undefined) { sets.push("draft = ?"); vals.push(input.draft ? 1 : 0); }
  if (input.slug !== undefined) { sets.push("slug = ?"); vals.push(input.slug); }
  sets.push("updated_at = ?");
  vals.push(now);

  // WHERE clause uses the original slug
  await db.prepare(`UPDATE posts SET ${sets.join(", ")} WHERE slug = ?`).bind(...vals, currentSlug).run();

  const targetSlug = input.slug ?? currentSlug;
  return getPostBySlug(db, targetSlug, true);
}

export async function deletePost(db: D1Database, slug: string) {
  await db.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
}
