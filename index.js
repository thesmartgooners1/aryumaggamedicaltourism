const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

if (menu && navigation) {
    const closeMenu = () => menu.setAttribute('aria-expanded', 'false');

    menu.hidden = false;

    menu.addEventListener('click', () => {
        const open = menu.getAttribute('aria-expanded') === 'true';
        menu.setAttribute('aria-expanded', String(!open));
    });

    navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            menu.focus();
        }
    });
}

const videoLink = document.querySelector('#video-link');
const videoDialog = document.querySelector('#video-dialog');

if (videoLink && typeof videoDialog?.showModal === 'function') {
    videoLink.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        videoDialog.showModal();
    });

    videoDialog.addEventListener('close', () => {
        videoDialog.querySelector('video')?.pause();
        videoLink.focus();
    });
}

const hospitalSearch = document.querySelector('#hospital-search');
const hospitalResults = document.querySelector('.hospital-results');
const hospitalCards = [...document.querySelectorAll('.hospital-grid li')];

if (hospitalSearch && hospitalResults) {
    function filterHospitals() {
        const query = hospitalSearch.value.trim().toLowerCase();
        let count = 0;

        for (const card of hospitalCards) {
            card.hidden = !card.textContent.toLowerCase().includes(query);
            if (!card.hidden) count += 1;
        }

        hospitalResults.textContent = count === 0
            ? 'No hospitals or clinics match your search.'
            : `${count} ${count === 1 ? 'listing' : 'listings'}`;
    }

    hospitalSearch.addEventListener('input', filterHospitals);
    filterHospitals();
    hospitalSearch.closest('.hospital-search')?.removeAttribute('hidden');
}

const chat = document.querySelector('.support-chat');

if (chat) {
    const launcher = chat.querySelector('summary');
    const closeButton = chat.querySelector('.support-close');
    const form = chat.querySelector('.support-form');
    const input = form.elements.message;
    const sendButton = form.querySelector('button[type="submit"]');
    const log = chat.querySelector('.support-log');
    const contacts = chat.querySelector('.support-actions');
    const topics = chat.querySelector('.support-topics');
    const topicButtons = [...(topics?.querySelectorAll('button') ?? [])];
    const aiOption = chat.querySelector('.support-ai');
    const aiEnabled = aiOption?.querySelector('input[type="checkbox"]');

    const emergencyPattern =
        /\b(?:emergenc(?:y|ies)|ambulance|not breathing|can(?:not|['’]t) breathe|unconscious|severe bleeding)\b|အရေးပေါ်|လူနာတင်ယာဉ်|အသက်ရှူမရ|သတိလစ်|ฉุกเฉิน|รถพยาบาล/iu;

    const privateDetailsPattern =
        /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s-]*){7,}|passport|medical record|date of birth|ဆေးမှတ်တမ်း|နိုင်ငံကူးလက်မှတ်/iu;

    const emergencyText = {
        en: 'If this is an emergency, call now. In Thailand, call 1669 for an ambulance or 191 for a police emergency. Outside Thailand, call your local emergency number.',
        my: 'အရေးပေါ်ဖြစ်နေရင် ချက်ချင်း ဖုန်းခေါ်ပါ။ ထိုင်းနိုင်ငံမှာ လူနာတင်ယာဉ်အတွက် 1669၊ ရဲအရေးပေါ်အတွက် 191 ကို ခေါ်ပါ။ ထိုင်းနိုင်ငံပြင်ပမှာ ဒေသခံ အရေးပေါ်ဖုန်းနံပါတ်ကို ခေါ်ပါ။'
    };

    const fallbackTopics = [
        {
            match: /symptoms?|diagnos|medication|dosage|side effects?|ရောဂါ|ဆေးသောက်/iu,
            en: 'A qualified clinician can help with medical questions. Our team can help you arrange a consultation.',
            my: 'ဆေးဘက်ဆိုင်ရာ မေးခွန်းတွေကို ဆရာဝန်နဲ့ တိုင်ပင်ပေးပါ။ ပြသဖို့ ရက်ချိန်းယူရာမှာ ကျွန်မတို့အဖွဲ့က ကူညီပေးနိုင်ပါတယ်။'
        },
        {
            match: /reschedule|cancel|change.*appointment|booking status|ရက်ပြောင်း|ဖျက်သိမ်း/iu,
            en: 'Please contact our team directly so we can check or change your existing booking.',
            my: 'ယူထားတဲ့ ရက်ချိန်းကို စစ်ဆေးဖို့ ဒါမှမဟုတ် ပြောင်းဖို့ ကျွန်မတို့အဖွဲ့ကို တိုက်ရိုက် ဆက်သွယ်ပေးပါ။'
        },
        {
            match: /prices?|costs?|fees?|quotes?|how much|ကုန်ကျ|ဈေး|စျေး/iu,
            en: 'Prices vary by hospital and service. Tell our team which service you’re interested in and we can help request a current quote.',
            my: 'ဈေးနှုန်းက ဆေးရုံနဲ့ ဝန်ဆောင်မှုအပေါ် မူတည်ပါတယ်။ လိုချင်တဲ့ ဝန်ဆောင်မှုကို ပြောပြပေးရင် လက်ရှိဈေးနှုန်းကို မေးမြန်းပေးနိုင်ပါတယ်။'
        },
        {
            match: /book|appointment|check[ -]?up|consultation|ရက်ချိန်း|ကျန်းမာရေးစစ်/iu,
            en: 'We can help arrange an appointment. Send our team the service you need, your preferred hospital or city, and dates that work for you.',
            my: 'ရက်ချိန်းယူရာမှာ ကူညီပေးနိုင်ပါတယ်။ လိုချင်တဲ့ ဝန်ဆောင်မှု၊ ဆေးရုံ ဒါမှမဟုတ် မြို့နဲ့ အဆင်ပြေမယ့် ရက်တွေကို ကျွန်မတို့အဖွဲ့ဆီ ပို့ပေးပါ။'
        },
        {
            match: /hospitals?|clinics?|phyathai|medpark|kdms|masterpiece|dermaster|ruamjairak|ဆေးရုံ|ဆေးခန်း/iu,
            en: 'You can use the Hospitals and clinics section to browse our directory. Our team can help you narrow down the options.',
            my: 'ဆေးရုံနဲ့ ဆေးခန်းစာရင်းကို ဝက်ဘ်ဆိုက်မှာ ကြည့်နိုင်ပါတယ်။ ရွေးချယ်ဖို့ ကျွန်မတို့အဖွဲ့က ကူညီပေးနိုင်ပါတယ်။'
        },
        {
            match: /travel|hotel|airport|flights?|transport|ခရီး|ဟိုတယ်|လေဆိပ်/iu,
            en: 'Our team can help plan travel around your appointment. Tell us your destination, travel dates, and what arrangements you need.',
            my: 'ရက်ချိန်းနဲ့ ကိုက်ညီအောင် ခရီးစဉ်စီစဉ်ဖို့ ကူညီပေးနိုင်ပါတယ်။ သွားမယ့်မြို့၊ ခရီးရက်နဲ့ လိုအပ်တာတွေကို ပြောပြပေးပါ။'
        }
    ];

    let language = 'en';
    let history = [];
    let busy = false;

    function addMessage(text, fromVisitor = false) {
        const bubble = document.createElement('p');

        if (fromVisitor) bubble.className = 'support-visitor';
        else bubble.lang = language;

        bubble.textContent = text;
        log.append(bubble);
        log.scrollTop = log.scrollHeight;
        return bubble;
    }

    function showContacts() {
        if (!contacts) return;

        const links = contacts.cloneNode(true);
        links.hidden = false;
        log.append(links);
        log.scrollTop = log.scrollHeight;
    }

    function showFallback(message) {
        const plain = message.trim().replace(/[\s\p{P}\p{S}]+$/u, '');

        if (/^(?:hi|hey|hello|english|good morning|good afternoon|good evening|မင်္ဂလာပါ(?:ရှင့်)?|မြန်မာလို မေးရန်)$/iu.test(plain)) {
            addMessage(language === 'my'
                ? 'မင်္ဂလာပါရှင့်။ Aryu Magga မှ ကြိုဆိုပါတယ်။ ဘာကူညီပေးရမလဲရှင့်။'
                : 'Hello! Welcome to Aryu Magga. How can I help you today?');
            return;
        }

        if (/^(?:thanks|thank you|ကျေးဇူးတင်ပါတယ်(?:ရှင့်)?)$/iu.test(plain)) {
            addMessage(language === 'my'
                ? 'ရပါတယ်ရှင့်။ ထပ်မေးချင်တာရှိရင် မေးလို့ရပါတယ်။'
                : 'You’re welcome! I’m happy to help if you have another question.');
            return;
        }

        const topic = fallbackTopics.find(({ match }) => match.test(message));

        addMessage(topic?.[language] ?? (language === 'my'
            ? 'အကူအညီလိုတဲ့အကြောင်း ကျွန်မတို့အဖွဲ့ဆီ WhatsApp ဒါမှမဟုတ် Facebook ကနေ ပြောပြပေးပါ။'
            : 'Please contact our team on WhatsApp or Facebook and tell us what you’d like help with.'));

        showContacts();
    }

    async function sendMessage(value) {
        const message = value.trim().slice(0, 500);
        if (!message || busy) return;

        if (/\p{Script=Myanmar}/u.test(message)) language = 'my';
        else if (message.toLowerCase() === 'english') language = 'en';

        addMessage(message, true);

        const emergency = emergencyPattern.test(message);
        if (emergency) addMessage(emergencyText[language]);

        if (!aiEnabled?.checked || privateDetailsPattern.test(message)) {
            if (!emergency) showFallback(message);
            return;
        }

        busy = true;
        sendButton.disabled = true;
        for (const button of topicButtons) button.disabled = true;

        const pending = addMessage(language === 'my'
            ? 'ဖြေကြားနေပါတယ်…'
            : 'Preparing an AI reply…');

        const requestHistory = history;
        const messages = [...requestHistory, { role: 'user', text: message }];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000),
                body: JSON.stringify({ messages, language })
            });

            if (!response.ok) throw new Error('AI endpoint unavailable');

            const { reply } = await response.json();

            if (!aiEnabled.checked || history !== requestHistory) {
                if (!emergency) showFallback(message);
                return;
            }

            if (typeof reply !== 'string' || !reply.trim()) {
                throw new Error('Empty AI reply');
            }

            addMessage(reply);
            history = [...messages, { role: 'model', text: reply }].slice(-6);

            if (!emergency) showContacts();
        } catch {
            if (!emergency) {
                addMessage(language === 'my'
                    ? 'AI အဖြေကို လောလောဆယ် မရနိုင်သေးပါ။'
                    : 'The AI reply is temporarily unavailable.');
                showFallback(message);
            }
        } finally {
            pending.remove();
            busy = false;
            sendButton.disabled = false;
            for (const button of topicButtons) button.disabled = false;
            log.scrollTop = log.scrollHeight;
        }
    }

    aiEnabled?.addEventListener('change', () => { history = []; });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const message = input.value.trim();
        if (!message || busy) return;

        input.value = '';
        input.focus();
        void sendMessage(message);
    });

    topics?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (button) void sendMessage(button.textContent);
    });

    function closeChat() {
        chat.open = false;
        launcher.focus();
    }

    if (closeButton) {
        closeButton.hidden = false;
        closeButton.addEventListener('click', closeChat);
    }

    chat.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && chat.open) closeChat();
    });

    if (aiOption) aiOption.hidden = false;
    if (topics) topics.hidden = false;
    if (contacts) contacts.hidden = true;
    form.hidden = false;
}
