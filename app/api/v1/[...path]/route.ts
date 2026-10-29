import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = (process.env.GATEWAY_URL || "http://localhost:8080").replace(
  /\/$/,
  ""
);

/**
 * Headers that must not be forwarded to the upstream gateway.
 * Notably, browsers attach `Origin: http://localhost:3000` on same-origin
 * POST/PUT/DELETE requests, which causes the backend's CORS filter to reject
 * proxied requests with 403 Forbidden.
 */
const EXCLUDED_REQUEST_HEADERS = new Set([
  "host",
  "origin",
  "referer",
  "connection",
  "content-length",
]);

const EXCLUDED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetUrl = `${GATEWAY_URL}/api/v1/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!EXCLUDED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!EXCLUDED_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the API gateway.",
        data: null,
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
