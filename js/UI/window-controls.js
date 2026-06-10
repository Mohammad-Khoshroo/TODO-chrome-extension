// ----------------------
//     WINDOW CHECK
// ----------------------
function checkWindowMaximized() {
    if (window.outerWidth >= window.screen.availWidth * 0.99) {
        document.body.classList.add('is-maximized-window');
    } else {
        document.body.classList.remove('is-maximized-window');
    }
}

window.addEventListener('resize', checkWindowMaximized);
checkWindowMaximized();
