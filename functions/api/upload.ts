interface Env {
  UPLOAD_SECRET?: string;
  RECEIVER_TUNNEL_URL?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/avif",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const configuredSecret = env.UPLOAD_SECRET;
  const tunnelUrl = env.RECEIVER_TUNNEL_URL;

  // 1. Auth check
  const authHeader = request.headers.get("Authorization");
  if (!configuredSecret || authHeader !== `Bearer ${configuredSecret}`) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Invalid or missing token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!tunnelUrl) {
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error: RECEIVER_TUNNEL_URL not set" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Validate MIME type & Content-Length header if present
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase().split(";")[0].trim();
  const originalFilename = request.headers.get("X-Original-Filename") || "upload.jpg";

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Invalid MIME type (${contentType}). Only JPEG, PNG, WEBP, HEIC, and AVIF are allowed.`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const contentLengthStr = request.headers.get("Content-Length");
  if (contentLengthStr) {
    const contentLength = parseInt(contentLengthStr, 10);
    if (!isNaN(contentLength) && contentLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File size exceeds 25MB limit (received ${contentLength} bytes)`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 3. Proxy payload directly to desktop tunnel receiver
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for large uploads

    const targetUrl = `${tunnelUrl.replace(/\/+$/, "")}/receive`;
    const proxyResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${configuredSecret}`,
        "Content-Type": contentType,
        "X-Original-Filename": originalFilename,
      },
      body: request.body,
      // @ts-ignore
      duplex: "half",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await proxyResponse.text();
    return new Response(responseText, {
      status: proxyResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Desktop receiver is offline or unreachable via tunnel.",
        details: err?.message || String(err),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
