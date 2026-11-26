const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const INSTRUCTIONS = `
You are the automated customer support assistant for Aryu Magga.
Reply naturally and concisely. Greet customers back, answer their
question directly, and use the conversation to understand follow-ups.
Use plain text. In Burmese, refer to our team as ကျွန်မတို့.

Aryu Magga is based in Yangon and helps coordinate medical appointments,
dental appointments, health check-ups, and travel arrangements.
Customers can browse the hospital and clinic directory on the website.
Staff can help check availability, request quotes, or change bookings.
For appointment inquiries, suggest sharing the requested service,
preferred city or hospital, and preferred dates directly with staff.

Emergency requests come first. If the customer is in Thailand, tell them
to call 1669 for an ambulance or 191 for a police emergency. If their
location is unknown, say "If you're in Thailand" before giving the Thai
numbers. Outside Thailand, tell them to call their local emergency
number. Tell them to call now if there is an active emergency.
Do not direct emergency callers to WhatsApp or Facebook.

Refer medical advice to a qualified clinician. Do not invent prices,
availability, booking confirmations, phone numbers, or links.
Do not ask for medical records, payment details, or personal identifiers.
`;

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!req.headers['content-type']?.startsWith('application/json')) {
        return res.status(415).json({ error: 'Expected JSON.' });
    }

    const { messages, language } = req.body ?? {};
    const valid =
        ['en', 'my'].includes(language) &&
        Array.isArray(messages) &&
        messages.length >= 1 &&
        messages.length <= 7 &&
        messages.length % 2 === 1 &&
        messages.every((entry, index) => {
            const visitor = index % 2 === 0;
            return entry &&
                entry.role === (visitor ? 'user' : 'model') &&
                typeof entry.text === 'string' &&
                entry.text.trim().length > 0 &&
                entry.text.length <= (visitor ? 500 : 1500);
        });

    if (!valid) {
        return res.status(400).json({ error: 'Invalid conversation.' });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = process.env.CLOUDFLARE_AI_TOKEN?.trim();

    if (!accountId || !token) {
        console.error('Aryu Magga chat: Cloudflare credentials are missing.');
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }

    try {
        const endpoint =
            `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`;

        const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(11000),
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 400,
                temperature: 0.3,
                messages: [
                    {
                        role: 'system',
                        content: `${INSTRUCTIONS}\nReply in ${language === 'my' ? 'Burmese' : 'English'}.`
                    },
                    ...messages.map(({ role, text }) => ({
                        role: role === 'model' ? 'assistant' : 'user',
                        content: text
                    }))
                ]
            })
        });

        if (!upstream.ok) {
            console.error(`Aryu Magga chat: Cloudflare returned HTTP ${upstream.status}.`);
            return res.status(503).json({ error: 'AI chat is unavailable.' });
        }

        const result = await upstream.json();
        const reply = result.choices?.[0]?.message?.content;

        if (typeof reply !== 'string' || !reply.trim()) {
            console.error('Aryu Magga chat: Cloudflare returned no reply text.');
            return res.status(502).json({ error: 'No AI reply was generated.' });
        }

        return res.status(200).json({ reply: reply.trim().slice(0, 1500) });
    } catch (error) {
        console.error(
            error?.name === 'TimeoutError'
                ? 'Aryu Magga chat: Cloudflare request timed out.'
                : 'Aryu Magga chat: Cloudflare request failed.'
        );
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }
}
