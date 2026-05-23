import type { APIRoute } from "astro";
import { signToken } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const { password } = await request.json();
  const adminPassword = import.meta.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
  }

  if (password !== adminPassword) {
    return new Response(JSON.stringify({ error: "密码错误" }), { status: 401 });
  }

  const token = await signToken();

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`,
    },
  });
};
