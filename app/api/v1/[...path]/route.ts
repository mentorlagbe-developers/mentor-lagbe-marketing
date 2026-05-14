import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

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

async function proxy(request: NextRequest, pathSegments: string[]) {
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

  // Clean up hop-by-hop / encoding headers that confuse some backends
  headers.delete("transfer-encoding");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("upgrade");
  headers.delete("proxy-authorization");
  headers.delete("proxy-authenticate");
  // Restore accurate content-length now that we have the full buffer
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
    });
  } catch (err) {
    // Backend is down, crashed, or closed the socket before responding
    const cause = err instanceof Error ? err.message : "Unknown network error";
    const isDown =
      cause.includes("ECONNREFUSED") ||
      cause.includes("ENOTFOUND") ||
      cause.includes("other side closed") ||
      cause.includes("UND_ERR_SOCKET");

    if (isDown) {
      return errorEnvelope(503, "The backend server is unavailable. Please try again shortly.", "SERVICE_UNAVAILABLE");
    }
    return errorEnvelope(502, `Upstream error: ${cause}`, "BAD_GATEWAY");
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
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
