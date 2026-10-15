interface Env {
  RECEIVER_TUNNEL_URL?: string;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const tunnelUrl = context.env.RECEIVER_TUNNEL_URL;

  if (!tunnelUrl) {
    return new Response(JSON.stringify({ online: false, error: "RECEIVER_TUNNEL_URL is not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let timeout: any;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 3500);

    const pingUrl = `${tunnelUrl.replace(/\/+$/, "")}/health`;
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: controller.signal,
    });

    if (res.ok) {
      return new Response(JSON.stringify({ online: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ online: false, status: res.status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ online: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
};
