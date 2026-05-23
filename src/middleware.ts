import { defineMiddleware } from "astro:middleware";
import { verifyToken } from "./lib/auth";

const ADMIN_ROUTES = ["/admin", "/admin/new"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Check if this is an admin route
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdminRoute) {
    const cookie = context.request.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];

    if (!token || !(await verifyToken(token))) {
      return context.redirect("/admin/login");
    }
  }

  return next();
});
