export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const trackingNumber = url.searchParams.get('number');

    if (!trackingNumber) {
      return new Response(
        JSON.stringify({ error: 'Tracking number is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const trackingData = {
      tracking_number: trackingNumber,
      status: 'In Transit',
      carrier: 'Demo Carrier',
      events: [
        {
          date: new Date().toISOString(),
          description: '675757657656 Package received at sorting facility',
          location: 'Distribution Center',
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Package picked up',
          location: 'Origin',
        },
      ],
    };

    return Response.json({
      success: true,
      ...trackingData,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
