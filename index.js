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
