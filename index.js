const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
}

menu.hidden = false;
menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
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

const videoLink = document.querySelector('#video-link');
const videoDialog = document.querySelector('#video-dialog');
const video = videoDialog.querySelector('video');

videoLink.addEventListener('click', (event) => {
    if (typeof videoDialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    videoDialog.showModal();
});

videoDialog.addEventListener('close', () => {
    video.pause();
    videoLink.focus();
});

const chat = document.querySelector('.support-chat');
const chatForm = chat.querySelector('.support-form');
const chatInput = chatForm.elements.message;
const chatLog = chat.querySelector('.support-log');
const chatContacts = chat.querySelector('.support-actions');

const chatTopics = chat.querySelector('.support-topics');
let chatLanguage = 'en';
let lastSupportTopic;

const supportReplies = [
    {
        match: /\b(?:diagnos\w*|symptoms?|medicines?|medication|dosage|side effects?)\b|ရောဂါ|ဆေးသောက်|ဝေဒနာ/iu,
        en: 'A qualified clinician can answer medical questions about symptoms, medicines, or treatment. If you’d like to arrange a consultation, our team can help you book one.',
        my: 'ရောဂါလက္ခဏာ၊ ဆေးဝါးနဲ့ ကုသမှုဆိုင်ရာ မေးခွန်းတွေကို ဆရာဝန်နဲ့ တိုင်ပင်ပေးပါ။ ဆရာဝန်နဲ့ ပြသဖို့ ရက်ချိန်းယူချင်ရင် ကျွန်မတို့အဖွဲ့က ကူညီပေးနိုင်ပါတယ်။',
        contact: true
    },
    {
        match: /\b(?:reschedule|cancel|change|confirmation|status)\b|ရက်ပြောင်း|ဖျက်သိမ်း|အတည်ပြု/iu,
        en: 'Our team can check or change an existing appointment. Please contact us on WhatsApp or Facebook so we can review your booking privately.',
        my: 'ယူထားတဲ့ ရက်ချိန်းကို စစ်ဆေးဖို့ ဒါမှမဟုတ် ပြောင်းလဲဖို့ WhatsApp သို့မဟုတ် Facebook ကနေ ကျွန်မတို့အဖွဲ့ကို ဆက်သွယ်ပေးပါ။',
        contact: true
    },
    {
        match: /\b(?:prices?|pricing|costs?|fees?|quotes?|payment|insurance|how much)\b|စျေး|ဈေး|ကုန်ကျ|ငွေပေး|အာမခံ/iu,
        en: 'Prices depend on the hospital and the service you need. Tell our team which service and hospital you’re considering, and we can help you request a current quote.',
        my: 'ကုန်ကျစရိတ်က ဆေးရုံနဲ့ ရယူမယ့် ဝန်ဆောင်မှုအပေါ် မူတည်ပါတယ်။ စိတ်ဝင်စားတဲ့ ဆေးရုံနဲ့ ဝန်ဆောင်မှုကို ပြောပြပေးရင် လက်ရှိဈေးနှုန်းကို မေးမြန်းပေးနိုင်ပါတယ်။',
        contact: true
    },
    {
        match: /\b(?:book\w*|appointments?|availability|consultation)\b|ရက်ချိန်း|ချိန်းဆို|တိုင်ပင်/iu,
        en: 'We can help arrange a medical, dental, or health check-up appointment. Message our team with the service you want, your preferred hospital or city, and your preferred dates so we can check availability.',
        my: 'ဆရာဝန်ပြသဖို့၊ သွားဆေးခန်းသွားဖို့နဲ့ ကျန်းမာရေးစစ်ဆေးဖို့ ရက်ချိန်းယူရာမှာ ကူညီပေးနိုင်ပါတယ်။ လိုချင်တဲ့ ဝန်ဆောင်မှု၊ ဆေးရုံ ဒါမှမဟုတ် မြို့နဲ့ အဆင်ပြေမယ့် ရက်တွေကို ကျွန်မတို့အဖွဲ့ဆီ ပို့ပေးပါ။',
        contact: true
    },
    {
        match: /\b(?:dental|dentist|check[ -]?up|screening|services?|cosmetic)\b|သွားဆေး|ကျန်းမာရေးစစ်|ဝန်ဆောင်မှု/iu,
        en: 'Aryu Magga helps coordinate medical appointments, dental visits, health check-ups, and travel arrangements. Which service would you like help with?',
        my: 'Aryu Magga က ဆရာဝန်ပြသဖို့၊ သွားဆေးခန်းသွားဖို့၊ ကျန်းမာရေးစစ်ဆေးဖို့နဲ့ ခရီးစဉ်စီစဉ်ဖို့ ကူညီပေးပါတယ်။ ဘယ်ဝန်ဆောင်မှုအတွက် အကူအညီလိုပါသလဲ။'
    },
    {
        match: /\b(?:travel|hotel|flights?|airport|transport|visa)\b|ခရီး|ဟိုတယ်|လေဆိပ်|ဗီဇာ/iu,
        en: 'We can help plan your travel around your appointment. Share your destination, travel dates, and the arrangements you need with our team.',
        my: 'ဆေးရုံရက်ချိန်းနဲ့ ကိုက်ညီအောင် ခရီးစဉ်စီစဉ်ရာမှာ ကူညီပေးနိုင်ပါတယ်။ သွားမယ့်မြို့၊ ခရီးရက်နဲ့ လိုအပ်တဲ့ အစီအစဉ်တွေကို ကျွန်မတို့အဖွဲ့ဆီ ပြောပြပေးပါ။',
        contact: true
    },
    {
        match: /\b(?:hospitals?|clinics?|phyathai|kdms|masterpiece|dermaster|ruamjairak|medpark|vimut|lanna)\b|ဆေးရုံ|ဆေးခန်း/iu,
        en: 'Browse our hospital and clinic directory for links to each provider. If you tell our team your preferred city and the type of appointment you need, we can help you narrow down the options.',
        my: 'ဆေးရုံနဲ့ ဆေးခန်းစာရင်းမှာ သက်ဆိုင်ရာ ဝက်ဘ်ဆိုက်တွေကို ကြည့်နိုင်ပါတယ်။ သွားချင်တဲ့မြို့နဲ့ လိုချင်တဲ့ ရက်ချိန်းအမျိုးအစားကို ပြောပြပေးရင် ရွေးချယ်ရာမှာ ကူညီပေးနိုင်ပါတယ်။',
        directory: true,
        contact: true
    },
];

const supportFallback = {
    en: 'Our team can help with that inquiry. Please message Aryu Magga on WhatsApp or Facebook and tell us what you’d like help with.',
    my: 'ဒီမေးခွန်းအတွက် ကျွန်မတို့အဖွဲ့က ကူညီပေးနိုင်ပါတယ်။ ဘာအကူအညီလိုလဲဆိုတာ WhatsApp သို့မဟုတ် Facebook ကနေ ပြောပြပေးပါ။',
    contact: true
};

const greetingPattern = /^(?:(?:hi+|hello|hey|good (?:morning|afternoon|evening))(?=$|[^a-z])|မင်္ဂလာပါ(?:ရှင့်|ခင်ဗျာ)?)/iu;
const greetingReply = {
    en: 'Hello! Thanks for reaching out to Aryu Magga. How can I help you today?',
    my: 'မင်္ဂလာပါရှင့်။ Aryu Magga ကို ဆက်သွယ်ပေးလို့ ကျေးဇူးတင်ပါတယ်။ ဘာကူညီပေးရမလဲရှင့်။'
};
const followUpPattern = /^(?:and\s+)?(?:what about|which one|how do i proceed|what(?: is|['’]s) next|tell me more|can you help|yes please|နောက်ထပ်|ဘယ်လိုလုပ်ရမလဲ)(?:[?!. ]*)$/iu;

function chooseSupportReply(message) {
    const greeted = greetingPattern.test(message);
    const question = message.replace(greetingPattern, '').replace(/^[\s\p{P}\p{S}]+/u, '');
    const shortMessage = question.replace(/[\s\p{P}\p{S}]+$/u, '');

    if (!shortMessage || /^(?:english|မြန်မာလို မေးရန်|how are you)$/iu.test(shortMessage)) {
        return greetingReply;
    }

    if (/^(?:thanks(?: a lot)?|thank you(?: so much)?|thx|ကျေးဇူးတင်ပါတယ်(?:ရှင့်|ခင်ဗျာ)?|ကျေးဇူးပါ)$/iu.test(shortMessage)) {
        return {
            en: 'You’re welcome! If anything else comes up while planning your visit, I’m happy to help.',
            my: 'ရပါတယ်ရှင့်။ ခရီးစဉ်စီစဉ်ရင်း ထပ်မေးချင်တာရှိရင် မေးလို့ရပါတယ်။'
        };
    }

    if (/^(?:bye|goodbye|see you|နှုတ်ဆက်ပါတယ်)$/iu.test(shortMessage)) {
        return {
            en: 'Take care, and thank you for contacting Aryu Magga.',
            my: 'Aryu Magga ကို ဆက်သွယ်ပေးလို့ ကျေးဇူးတင်ပါတယ်ရှင့်။'
        };
    }

    const topic = supportReplies.find(({ match }) => match.test(question));
    if (topic) lastSupportTopic = topic;

    const followUp = !topic && followUpPattern.test(question) ? lastSupportTopic : undefined;
    const answer = followUp?.contact ? {
        ...followUp,
        en: 'The next step is to message our team on WhatsApp or Facebook. Mention what we just discussed so we can help you pick up from there.',
        my: 'နောက်တစ်ဆင့်အနေနဲ့ WhatsApp ဒါမှမဟုတ် Facebook ကနေ ကျွန်မတို့အဖွဲ့ကို ဆက်သွယ်ပေးပါ။ ခုနက ဆွေးနွေးထားတဲ့အကြောင်းလေး ထည့်ပြောပေးရင် ဆက်ကူညီပေးနိုင်ပါတယ်။'
    } : topic ?? followUp ?? supportFallback;
    if (!greeted) return answer;

    return {
        ...answer,
        en: `Hello! ${answer.en}`,
        my: `မင်္ဂလာပါရှင့်။ ${answer.my}`
    };
}

const aiOption = chat.querySelector('.support-ai');
const aiEnabled = aiOption.querySelector('input');
let aiHistory = [];
let answering = false;
const privateDetails = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s-]*){7,}|passport|medical record|date of birth|ဆေးမှတ်တမ်း|နိုင်ငံကူးလက်မှတ်/iu;

aiEnabled.addEventListener('change', () => { aiHistory = []; });

async function requestAiReply(message, language) {
    const historyAtStart = aiHistory;
    const messages = [...historyAtStart, { role: 'user', text: message }];
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({ messages, language })
        });
        if (!response.ok) return null;
        const { reply } = await response.json();
        if (!aiEnabled.checked || typeof reply !== 'string' || !reply.trim()) return null;

        if (aiHistory === historyAtStart) {
            aiHistory = [...messages, { role: 'model', text: reply }].slice(-6);
        }
        return reply;
    } catch {
        return null;
    }
}

async function respondToCustomer(message) {
    if (answering) return;
    answering = true;
    if (/\p{Script=Myanmar}/u.test(message)) chatLanguage = 'my';
    else if (message.toLowerCase() === 'english') chatLanguage = 'en';

    const visitor = document.createElement('p');
    visitor.className = 'support-visitor';
    visitor.textContent = message;
    const answer = chooseSupportReply(message);
    chatLog.append(visitor);
    const language = chatLanguage;
    const shouldAskAi = aiEnabled.checked && !privateDetails.test(message) &&
        !supportReplies[0].match.test(message);
    let aiReply;
    if (shouldAskAi) {
        const pending = document.createElement('p');
        pending.textContent = language === 'my' ? 'ဖြေကြားနေပါတယ်…' : 'Preparing a reply…';
        chatLog.append(pending);
        chatLog.scrollTop = chatLog.scrollHeight;
        chatForm.querySelector('button').disabled = true;
        for (const button of chatTopics.querySelectorAll('button')) button.disabled = true;
        aiReply = await requestAiReply(message, language);
        pending.remove();
        chatForm.querySelector('button').disabled = false;
        for (const button of chatTopics.querySelectorAll('button')) button.disabled = false;
    }

    const reply = document.createElement('div');
    const replyText = document.createElement('p');
    replyText.lang = chatLanguage;
    replyText.textContent = aiReply ?? answer[language];
    reply.append(replyText);

    if (answer.directory) {
        const link = document.createElement('a');
        link.href = '#hospitals';
        link.textContent = chatLanguage === 'my' ? 'ဆေးရုံနဲ့ ဆေးခန်းစာရင်း' : 'Browse the directory';
        link.addEventListener('click', () => { chat.open = false; });
        reply.append(link);
    }

    if (answer.contact || aiReply) {
        const links = chatContacts.cloneNode(true);
        links.hidden = false;
        reply.append(links);
    }

    chatLog.append(reply);
    answering = false;
    chatLog.scrollTop = chatLog.scrollHeight;
}

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || answering) return;

    respondToCustomer(message);
    chatInput.value = '';
    chatInput.focus();
});

chatTopics.addEventListener('click', (event) => {
    const topic = event.target.closest('button');
    if (topic) respondToCustomer(topic.textContent);
});

aiOption.hidden = false;
chatTopics.hidden = false;
chatForm.hidden = false;
chatContacts.hidden = true;

const chatLauncher = chat.querySelector('summary');
const chatCloseButton = chat.querySelector('.support-close');

function closeChat() {
    chat.open = false;
    chatLauncher.focus();
}

chatCloseButton.hidden = false;
chatCloseButton.addEventListener('click', closeChat);
chat.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chat.open) closeChat();
});

const hospitalSearch = document.querySelector('#hospital-search');
const hospitalResults = document.querySelector('.hospital-results');
const hospitalCards = [...document.querySelectorAll('.hospital-grid li')];

function filterHospitals() {
    const query = hospitalSearch.value.trim().toLowerCase();
    let matches = 0;

    for (const card of hospitalCards) {
        card.hidden = !card.textContent.toLowerCase().includes(query);
        if (!card.hidden) matches += 1;
    }

    if (matches === 0) {
        hospitalResults.textContent = 'No hospitals or clinics match your search.';
    } else {
        hospitalResults.textContent = `${matches} ${matches === 1 ? 'listing' : 'listings'}`;
    }
}

hospitalSearch.addEventListener('input', filterHospitals);
filterHospitals();
hospitalSearch.closest('.hospital-search').hidden = false;
