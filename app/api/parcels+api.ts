export async function POST(request: Request) {
  try {
    const body = await request.json();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Track API is working correctly!",
        received: body,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
