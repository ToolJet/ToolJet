function centerActiveSidebarItem() {
    const activeItem = document.querySelector('.menu__link--active');
    if (activeItem) {
        const container = activeItem.closest('.menu');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();
            const offset = itemRect.top - containerRect.top - container.clientHeight / 2 + itemRect.height / 2;

            container.scrollTo({
                top: container.scrollTop + offset,
                behavior: 'smooth',
            });
        }
    }
}

// Retry until sidebar is ready (because Docusaurus uses client-side routing)
function waitForSidebarAndCenter(retries = 10) {
    const sidebarExists = document.querySelector('.menu__link--active');
    if (sidebarExists) {
        centerActiveSidebarItem();
    } else if (retries > 0) {
        setTimeout(() => waitForSidebarAndCenter(retries - 1), 200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    waitForSidebarAndCenter();
});

// Also run on client-side navigation
window.addEventListener('popstate', waitForSidebarAndCenter);
window.addEventListener('hashchange', waitForSidebarAndCenter);
