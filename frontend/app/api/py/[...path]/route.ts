import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `http://127.0.0.1:8080/api/${path}${search}`;

  try {
    const res = await fetch(targetUrl, { cache: "no-store" });
    const contentType = res.headers.get("Content-Type") || "";
    
    // For binary content like PDF
    if (contentType.includes("application/pdf")) {
      const data = await res.arrayBuffer();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": contentType,
        },
      });
    }

    // If backend returned an error or non-JSON text (e.g. "Internal Server Error")
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed, { status: res.status });
    } catch {
      return NextResponse.json(
        { error: text || res.statusText || "Backend error", status: res.status },
        { status: res.status }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const body = await request.text();
  const targetUrl = `http://127.0.0.1:8080/api/${path}`;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}

