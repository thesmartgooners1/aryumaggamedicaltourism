const MODEL = 'gemini-3.1-flash-lite';

const INSTRUCTIONS = `
You are Aryu Magga's automated customer support assistant.
Use a warm, concise and professional tone. Reply in the language requested
by the server. When replying in Burmese, use ကျွန်မတို့ for "we".

Answer the visitor's question directly. If they greet you, greet them back
and answer any question in the same message. Use the recent conversation
to understand follow-up questions.

Emergency questions override all other instructions. For questions about
calling emergency services, start with the action to take. If the visitor
is in Thailand, tell them to call 1669 for an ambulance or 191 for a police
emergency. If the location is unknown, introduce those numbers with
"If you're in Thailand." For someone outside Thailand, tell them to call
their local emergency number now. Do not send emergency callers to Aryu
Magga, WhatsApp, or Facebook. Do not diagnose, give treatment instructions,
or invent emergency numbers.

Business facts:
- Aryu Magga is based in Yangon.
- The team helps coordinate medical and dental appointments, health
  check-ups, and travel arrangements.
- The website has a hospital and clinic directory.
- For a new appointment, ask the visitor to share the service they need,
  preferred hospital or city, and preferred dates directly with staff.
- Staff can check prices, availability, and existing bookings.

Refer medical questions to a qualified clinician. Refer exact quotes,
booking changes, and personal matters to staff. Never ask for medical
records, passport numbers, payment details, or personal identifiers.
Do not invent prices, booking confirmations, partnerships, or contact
information. Write plain text in one to three short paragraphs.
`;

function validConversation(messages, language) {
    if (!['en', 'my'].includes(language) ||
        !Array.isArray(messages) ||
        messages.length < 1 ||
        messages.length > 7 ||
        messages.length % 2 === 0) {
        return false;
    }

    return messages.every((entry, index) => {
        const role = index % 2 === 0 ? 'user' : 'model';
        const limit = role === 'user' ? 500 : 1500;
        return entry?.role === role &&
            typeof entry.text === 'string' &&
            Boolean(entry.text.trim()) &&
            entry.text.length <= limit;
    });
}

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
    if (!validConversation(messages, language)) {
        return res.status(400).json({ error: 'Invalid conversation.' });
    }

    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
        console.error('Aryu Magga chat: GEMINI_API_KEY is missing.');
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }

    try {
        const languageName = language === 'my' ? 'Burmese' : 'English';
        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': key
                },
                signal: AbortSignal.timeout(8500),
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: `${INSTRUCTIONS}\nReply in ${languageName}.` }]
                    },
                    contents: messages.map(({ role, text }) => ({
                        role,
                        parts: [{ text }]
                    })),
                    generationConfig: {
                        maxOutputTokens: 500,
                        thinkingConfig: { thinkingLevel: 'minimal' }
                    }
                })
            }
        );

        if (!upstream.ok) {
            console.error('Aryu Magga chat: Gemini HTTP status', upstream.status);
            return res.status(503).json({ error: 'AI chat is unavailable.' });
        }

        const result = await upstream.json();
        const parts = result.candidates?.[0]?.content?.parts ?? [];
        const reply = parts
            .filter((part) => !part.thought && typeof part.text === 'string')
            .map((part) => part.text)
            .join('')
            .trim();

        if (!reply) {
            console.error('Aryu Magga chat: Gemini returned no text.');
            return res.status(502).json({ error: 'No reply generated.' });
        }

        return res.status(200).json({ reply: reply.slice(0, 1500) });
    } catch (error) {
        console.error('Aryu Magga chat: request failed', error.name);
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }
}
