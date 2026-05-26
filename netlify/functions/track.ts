export async function handler(event: any) {
  try {
    const number = event.queryStringParameters?.number;

    if (!number) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Tracking number is required" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const trackingData = {
      success: true,
      tracking_number: number,
      status: "In Transit",
      carrier: "Demo Carrier",
      events: [
        {
          date: new Date().toISOString(),
          description: " Package received at sorting facility",
          location: "Distribution Center",
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          description: "Package picked up",
          location: "Origin",
        },
      ],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(trackingData),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
