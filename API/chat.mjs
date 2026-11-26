const model = 'gemini-3.1-flash-lite';
const instructions = `
You are Aryu Magga's automated customer support assistant. Be warm and concise.
Greet visitors who greet you, and answer questions they include in the same message.
Reply in the requested language (English or Burmese). In Burmese use ကျွန်မတို့.
Use the following facts only: Aryu Magga is based in Yangon and helps coordinate
medical and dental appointments, health check-ups, and travel arrangements.
The website has a hospital and clinic directory. Availability and quotes must
be checked by staff. For a general appointment inquiry, suggest sharing the
service, preferred city or hospital, and preferred dates directly with staff.
For clinical questions, refer the visitor to a qualified clinician. Refer prices,
booking changes, personal matters, and unknown information to staff.
Never ask for medical records, personal identifiers, or payment details.
Never claim to have booked or confirmed anything. Do not invent prices,
medical advice, visa rules, partnerships, links, or contact numbers.
Write plain text, no Markdown. The website adds the contact links separately.
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
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 7 ||
        !['en', 'my'].includes(language) ||
        messages.some((entry, index) => !entry ||
            entry.role !== (index % 2 === 0 ? 'user' : 'model') ||
            typeof entry.text !== 'string' || !entry.text.trim() ||
            entry.text.length > (entry.role === 'user' ? 500 : 1500)) ||
        messages.at(-1).role !== 'user') {
        return res.status(400).json({ error: 'Invalid conversation.' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(503).json({ error: 'AI chat is unavailable.' });

    try {
        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                signal: AbortSignal.timeout(8500),
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: instructions + ' Reply in ' + (language === 'my' ? 'Burmese.' : 'English.') }] },
                    contents: messages.map(({ role, text }) => ({ role, parts: [{ text }] })),
                    generationConfig: { maxOutputTokens: 350, thinkingConfig: { thinkingLevel: 'minimal' } }
                })
            }
        );
        if (!upstream.ok) return res.status(503).json({ error: 'AI chat is unavailable.' });

        const result = await upstream.json();
        const reply = result.candidates?.[0]?.content?.parts
            ?.filter((part) => !part.thought && typeof part.text === 'string')
            .map((part) => part.text).join('').trim();
        if (!reply) return res.status(502).json({ error: 'No reply generated.' });
        return res.status(200).json({ reply: reply.slice(0, 1500) });
    } catch {
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }
}
