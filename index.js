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

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    const visitor = document.createElement('p');
    visitor.className = 'support-visitor';
    visitor.textContent = message;

    const burmese = /\p{Script=Myanmar}/u.test(message);
    const reply = document.createElement('div');
    const replyText = document.createElement('p');
    replyText.lang = burmese ? 'my' : 'en';
    replyText.textContent = burmese
        ? 'အကူအညီရယူဖို့ Aryu Magga Admin ကို WhatsApp သို့မဟုတ် Facebook ကနေ တိုက်ရိုက် ဆက်သွယ်နိုင်ပါတယ်။'
        : 'Thanks for your message! Please contact the Aryu Magga admin on WhatsApp or Facebook.';
    const links = chatContacts.cloneNode(true);
    links.hidden = false;
    reply.append(replyText, links);
    chatLog.append(visitor, reply);

    chatInput.value = '';
    chatLog.scrollTop = chatLog.scrollHeight;
    chatInput.focus();
});

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
