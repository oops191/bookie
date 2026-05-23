import type { APIRoute } from "astro";
import { verifyToken } from "../../../lib/auth";
import { getPostBySlug, updatePost, deletePost } from "../../../lib/db";

export const GET: APIRoute = async ({ params, locals, request }) => {
  const db = locals.runtime.env.DB;
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const isAdmin = token ? await verifyToken(token) : false;

  const post = await getPostBySlug(db, params.slug!, isAdmin);
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return new Response(JSON.stringify(post), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, locals, request }) => {
  const db = locals.runtime.env.DB;
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];

  if (!token || !(await verifyToken(token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const post = await updatePost(db, params.slug!, body);
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return new Response(JSON.stringify(post), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params, locals, request }) => {
  const db = locals.runtime.env.DB;
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];

  if (!token || !(await verifyToken(token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await deletePost(db, params.slug!);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
