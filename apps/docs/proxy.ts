import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxy as localeProxy } from "nextra/locales";

/**
 * Browsers or other localhost apps (e.g. MSW) may request `/mockServiceWorker.js`.
 * Without this, the request hits `[[...mdxPath]]` and Nextra tries to load it as MDX.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/mockServiceWorker.js") {
    return new NextResponse(
      "// antd-admin docs: no MSW; unregister stray workers from other localhost apps if needed.\n",
      {
        status: 200,
        headers: {
          "content-type": "application/javascript; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  return localeProxy(request);
}

export const config = {
  matcher: [
    "/mockServiceWorker.js",
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)",
  ],
};
