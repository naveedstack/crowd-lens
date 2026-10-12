export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (!base) {
    return Response.json({ ok: false }, { status: 503 });
  }

  try {
    const response = await fetch(`${base}/health`, { cache: "no-store" });
    const body = (await response.json()) as unknown;
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
