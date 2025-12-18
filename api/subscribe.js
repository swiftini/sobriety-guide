export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, firstName } = req.body;

    // Validate required fields
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const formId = process.env.KIT_FORM_ID;
    const apiKey = process.env.KIT_API_KEY;

    if (!formId || !apiKey) {
        console.error('KIT_FORM_ID or KIT_API_KEY environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const response = await fetch(
            `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    email,
                    first_name: firstName,
                }),
            }
        );

        const data = await response.json();

        // Log the full response for debugging
        console.log('Kit API response status:', response.status);
        console.log('Kit API response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Kit API error:', data);
            return res.status(response.status).json({ error: 'Failed to subscribe', details: data });
        }

        // Check if subscription was actually created
        if (!data.subscription) {
            console.error('No subscription in response:', data);
            return res.status(400).json({ error: 'Subscription not created', details: data });
        }

        console.log('Subscriber added successfully:', data.subscription.subscriber.email_address);
        return res.status(200).json({ success: true, subscription: data.subscription });
    } catch (error) {
        console.error('Subscription error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
