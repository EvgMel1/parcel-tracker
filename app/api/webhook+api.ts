export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Webhook received:', body);

    return Response.json({
      success: true,
      message: 'Webhook processed successfully',
      received_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: Request) {
  return Response.json({
    message: 'Webhook endpoint is active',
    method: 'POST',
  });
}
