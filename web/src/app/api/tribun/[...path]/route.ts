type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(
  request: Request,
  context: RouteContext,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return Response.json(
      {
        success: false,
        message: "API_URL environment variable is missing.",
      },
      {
        status: 500,
      },
    );
  }

  const { path } = await context.params;

  const targetUrl = `${apiUrl}/${path.join("/")}`;

  const headers = new Headers();

  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const cookie = request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const options: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    options.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, options);

    const body = await response.text();

    const responseHeaders = new Headers();

    responseHeaders.set(
      "content-type",
      response.headers.get("content-type") ??
      "application/json",
    );

    const setCookie = response.headers.get("set-cookie");

    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie);
    }

    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Tribün API proxy error:", error);

    return Response.json(
      {
        success: false,
        message: "Backend API'ye ulaşılamadı.",
      },
      {
        status: 502,
      },
    );
  }
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}