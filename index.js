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
    {
        match: /^(?:hi|hello|hey|english|မင်္ဂလာပါ|မြန်မာလို မေးရန်)[!. ]*$/iu,
        en: 'Hello! How can I help you today? You can ask about bookings, hospital options, prices, or travel arrangements.',
        my: 'မင်္ဂလာပါ။ ရက်ချိန်းယူတာ၊ ဆေးရုံရွေးတာ၊ ကုန်ကျစရိတ် ဒါမှမဟုတ် ခရီးစဉ်စီစဉ်တာနဲ့ ပတ်သက်ပြီး မေးလို့ရပါတယ်။'
    }
];

const supportFallback = {
    en: 'Our team can help with that inquiry. Please message Aryu Magga on WhatsApp or Facebook and tell us what you’d like help with.',
    my: 'ဒီမေးခွန်းအတွက် ကျွန်မတို့အဖွဲ့က ကူညီပေးနိုင်ပါတယ်။ ဘာအကူအညီလိုလဲဆိုတာ WhatsApp သို့မဟုတ် Facebook ကနေ ပြောပြပေးပါ။',
    contact: true
};

function respondToCustomer(message) {
    if (/\p{Script=Myanmar}/u.test(message)) chatLanguage = 'my';
    else if (message.toLowerCase() === 'english') chatLanguage = 'en';

    const visitor = document.createElement('p');
    visitor.className = 'support-visitor';
    visitor.textContent = message;
    const answer = supportReplies.find(({ match }) => match.test(message)) ?? supportFallback;

    const reply = document.createElement('div');
    const replyText = document.createElement('p');
    replyText.lang = chatLanguage;
    replyText.textContent = answer[chatLanguage];
    reply.append(replyText);

    if (answer.directory) {
        const link = document.createElement('a');
        link.href = '#hospitals';
        link.textContent = chatLanguage === 'my' ? 'ဆေးရုံနဲ့ ဆေးခန်းစာရင်း' : 'Browse the directory';
        link.addEventListener('click', () => { chat.open = false; });
        reply.append(link);
    }

    if (answer.contact) {
        const links = chatContacts.cloneNode(true);
        links.hidden = false;
        reply.append(links);
    }

    chatLog.append(visitor, reply);
    chatLog.scrollTop = chatLog.scrollHeight;
}

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    respondToCustomer(message);
    chatInput.value = '';
    chatInput.focus();
});

chatTopics.addEventListener('click', (event) => {
    const topic = event.target.closest('button');
    if (topic) respondToCustomer(topic.textContent);
});

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
