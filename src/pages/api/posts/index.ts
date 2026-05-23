import type { APIRoute } from "astro";
import { verifyToken } from "../../../lib/auth";
import { getPosts, createPost } from "../../../lib/db";

export const GET: APIRoute = async ({ locals, request }) => {
  const db = locals.runtime.env.DB;
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const isAdmin = token ? await verifyToken(token) : false;

  const posts = await getPosts(db, isAdmin);
  return new Response(JSON.stringify(posts), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ locals, request }) => {
  const db = locals.runtime.env.DB;
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];

  if (!token || !(await verifyToken(token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const { slug, title, description, content, draft } = body;

  if (!slug || !title || !description || !content) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const existing = await db.prepare("SELECT slug FROM posts WHERE slug = ?").bind(slug).first();
  if (existing) {
    return new Response(JSON.stringify({ error: "Slug already exists" }), { status: 409 });
  }

  const post = await createPost(db, { slug, title, description, content, draft: !!draft });
  return new Response(JSON.stringify(post), { status: 201, headers: { "Content-Type": "application/json" } });
};
