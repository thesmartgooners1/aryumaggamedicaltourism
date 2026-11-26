const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const INSTRUCTIONS = `
You are the automated customer support assistant for Aryu Magga.
Respond naturally, professionally, and concisely in the requested language.
Greet customers back and answer any question they included in the greeting.
Use the conversation to understand follow-up questions.

Refer to the company as "Aryu Magga" or "the Aryu Magga team" in English.
In Burmese, use "Aryu Magga" or "Aryu Magga အဖွဲ့".
Do not use "ကျွန်မတို့" or "ကျွန်တော်တို့". Keep English replies in English.

Emergency questions take priority. For an active emergency, tell the
customer to call now. In Thailand, call 1669 for an ambulance or 191
for a police emergency. If the customer's location is unknown, say
"If you're in Thailand" before giving those numbers. Outside Thailand,
tell the customer to call their local emergency number. Do not direct
emergency callers to WhatsApp or Facebook.

When someone asks how to contact Aryu Magga, how to reach staff, or asks
for WhatsApp or Facebook, give the contact details first.
The verified Aryu Magga WhatsApp number is +95 9 788 788 775.
Customers can also message Aryu Magga on Facebook. The website displays
clickable contact buttons below the reply.
For a contact-only question, answer in one or two sentences.
Do not add booking instructions unless the customer also asks how to book.

Example English reply:
You can reach Aryu Magga on WhatsApp at +95 9 788 788 775 or message the Aryu Magga team on Facebook.

Example Burmese reply:
Aryu Magga အဖွဲ့ကို WhatsApp နံပါတ် +95 9 788 788 775 သို့မဟုတ် Facebook ကနေ ဆက်သွယ်နိုင်ပါတယ်ရှင့်။

Aryu Magga is based in Yangon and helps coordinate medical and dental
appointments, health check-ups, and travel arrangements. Customers can
browse the hospital and clinic directory on the website. The Aryu Magga
team can help check availability, request quotes, and review booking changes.
For booking inquiries, suggest sharing the requested service, preferred city
or hospital, and preferred dates directly with the Aryu Magga team.

Refer clinical questions to a qualified clinician. Do not give diagnoses or
treatment advice. Do not invent prices, availability, confirmed bookings,
partnerships, phone numbers, or links. Do not ask for personal identifiers,
medical records, or payment details.

Write plain text. The website adds contact links separately.
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

    const validConversation =
        ['en', 'my'].includes(language) &&
        Array.isArray(messages) &&
        messages.length >= 1 &&
        messages.length <= 7 &&
        messages.length % 2 === 1 &&
        messages.every((entry, index) => {
            const isVisitor = index % 2 === 0;
            const expectedRole = isVisitor ? 'user' : 'model';
            const maxLength = isVisitor ? 500 : 1500;

            return entry &&
                entry.role === expectedRole &&
                typeof entry.text === 'string' &&
                entry.text.trim().length > 0 &&
                entry.text.length <= maxLength;
        });

    if (!validConversation) {
        return res.status(400).json({ error: 'Invalid conversation.' });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = process.env.CLOUDFLARE_AI_TOKEN?.trim();

    if (!accountId || !token) {
        console.error('Aryu Magga chat: Cloudflare credentials are missing.');
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }

    const endpoint =
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`;
    const replyLanguage = language === 'my' ? 'Burmese' : 'English';

    try {
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
                        content: `${INSTRUCTIONS}\nReply in ${replyLanguage}.`
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
        const content = result.choices?.[0]?.message?.content;

        if (typeof content !== 'string' || !content.trim()) {
            console.error('Aryu Magga chat: Cloudflare returned no reply text.');
            return res.status(502).json({ error: 'No AI reply was generated.' });
        }

        // Keep the company name consistent if the model uses a Burmese pronoun.
        const reply = content.trim().replace(
            /(?:ကျွန်မတို့|ကျွန်တော်တို့)(?:\s*အဖွဲ့)?/gu,
            language === 'my' ? 'Aryu Magga အဖွဲ့' : 'the Aryu Magga team'
        );

        return res.status(200).json({ reply: reply.slice(0, 1500) });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        console.error(timedOut
            ? 'Aryu Magga chat: Cloudflare request timed out.'
            : 'Aryu Magga chat: Cloudflare request failed.');
        return res.status(503).json({ error: 'AI chat is unavailable.' });
    }
}
