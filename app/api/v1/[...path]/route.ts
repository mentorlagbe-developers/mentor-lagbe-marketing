import { NextRequest, NextResponse } from "next/server";

function isComingSoon(): boolean {
  return (
    process.env.COMING_SOON === "true" ||
    process.env.NEXT_PUBLIC_COMING_SOON === "true"
  );
}

/** Prefer 127.0.0.1 — avoids Node fetch "fetch failed" on some macOS IPv6 localhost setups. */
const BACKEND_API_BASE =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:3000/api/v1";

function buildBackendUrl(pathSegments: string[], search: string) {
  const base = BACKEND_API_BASE.endsWith("/")
    ? BACKEND_API_BASE.slice(0, -1)
    : BACKEND_API_BASE;
  const path = pathSegments.join("/");
  return `${base}/${path}${search}`;
}

function errorEnvelope(status: number, message: string, code = "UPSTREAM_ERROR") {
  return NextResponse.json(
    { success: false, error: { code, message, statusCode: status } },
    { status }
  );
}

function isBackendUnreachable(cause: string): boolean {
  return (
    cause.includes("ECONNREFUSED") ||
    cause.includes("ENOTFOUND") ||
    cause.includes("fetch failed") ||
    cause.includes("ECONNRESET") ||
    cause.includes("EPIPE") ||
    cause.includes("other side closed") ||
    cause.includes("UND_ERR_SOCKET") ||
    cause.includes("socket hang up")
  );
}

// BACKEND_LIVE — forwards browser /api/v1/* to Nest (not used when COMING_SOON=true)
async function proxy(request: NextRequest, pathSegments: string[]) {
  if (isComingSoon()) {
    return errorEnvelope(
      503,
      "API proxy disabled while Mentor Lagbe is in coming-soon mode.",
      "COMING_SOON"
    );
  }

  const backendUrl = buildBackendUrl(pathSegments, request.nextUrl.search);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let body: ArrayBuffer | undefined;
  try {
    body = hasBody ? await request.arrayBuffer() : undefined;
  } catch {
    return errorEnvelope(400, "Failed to read request body.");
  }

  headers.delete("transfer-encoding");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("upgrade");
  headers.delete("proxy-authorization");
  headers.delete("proxy-authenticate");
  if (body !== undefined) {
    headers.set("content-length", String(body.byteLength));
  }

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : "Unknown network error";

    if (isBackendUnreachable(cause)) {
      return errorEnvelope(
        503,
        "Cannot reach the API server. Ensure the backend is running on port 3000 (npm run start:dev:api-only) and try again.",
        "SERVICE_UNAVAILABLE"
      );
    }
    return errorEnvelope(502, `Upstream error: ${cause}`, "BAD_GATEWAY");
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  // Buffer body so half-closed upstream streams do not surface as "fetch failed" to the browser.
  const responseBody = await upstream.arrayBuffer();

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
