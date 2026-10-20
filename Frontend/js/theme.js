(() => {
    const storageKey = 'kag-maridadi-theme';
    const root = document.documentElement;

    function getSavedTheme() {
        try {
            return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    }

    function applyTheme(theme) {
        const selectedTheme = theme === 'light' ? 'light' : 'dark';
        root.dataset.theme = selectedTheme;
        try {
            localStorage.setItem(storageKey, selectedTheme);
        } catch {
            // The theme still changes for this page if storage is unavailable.
        }

        document.querySelectorAll('[data-theme-choice]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.themeChoice === selectedTheme));
        });
    }

    // Apply the saved choice before the rest of the page is painted.
    root.dataset.theme = getSavedTheme();

    function addThemeControls() {
        if (document.querySelector('.theme-switcher')) return;

        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Choose color theme');
        switcher.innerHTML = `
            <span class="theme-switcher-label">Theme</span>
            <button type="button" data-theme-choice="light" aria-label="Use light theme">Light</button>
            <button type="button" data-theme-choice="dark" aria-label="Use dark theme">Dark</button>
        `;
        switcher.addEventListener('click', event => {
            const button = event.target.closest('[data-theme-choice]');
            if (button) applyTheme(button.dataset.themeChoice);
        });
        document.body.appendChild(switcher);
        applyTheme(root.dataset.theme);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addThemeControls, { once: true });
    } else {
        addThemeControls();
    }
})();
