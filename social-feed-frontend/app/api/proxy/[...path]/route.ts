import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function getBackendOrigin() {
  const direct = process.env.BACKEND_URL?.trim();
  if (direct) return direct.replace(/\/+$/, "");

  const legacy = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (legacy) return legacy.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  return "";
}

async function handler(req: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const backendOrigin = getBackendOrigin();
  if (!backendOrigin) {
    return NextResponse.json(
      { message: "Proxy misconfigured: set BACKEND_URL (e.g. https://<render-app>.onrender.com)" },
      { status: 500 },
    );
  }

  const { path } = await paramsPromise;
  const upstreamUrl = new URL(`${backendOrigin}/api/${path.join("/")}`);
  upstreamUrl.search = req.nextUrl.search;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers();
  const resContentType = upstreamRes.headers.get("content-type");
  if (resContentType) resHeaders.set("content-type", resContentType);

  const getSetCookie = (upstreamRes.headers as unknown as { getSetCookie?: () => string[] })
    .getSetCookie;
  const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(upstreamRes.headers) : [];
  if (setCookies.length) {
    for (const c of setCookies) resHeaders.append("set-cookie", c);
  } else {
    const single = upstreamRes.headers.get("set-cookie");
    if (single) resHeaders.set("set-cookie", single);
  }

  const buf = await upstreamRes.arrayBuffer();
  return new NextResponse(buf, { status: upstreamRes.status, headers: resHeaders });
}

export const GET = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handler(req, ctx.params);
export const POST = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handler(req, ctx.params);
export const PUT = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handler(req, ctx.params);
export const PATCH = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handler(req, ctx.params);
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handler(req, ctx.params);

