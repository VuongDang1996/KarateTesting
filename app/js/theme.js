import { Storage } from './storage.js';

export function initTheme() {
    var saved = Storage.get('theme', null);
    if (!saved) {
        saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon();
}

export function toggleTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        Storage.set('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        Storage.set('theme', 'dark');
    }
    updateThemeIcon();
}

export function updateThemeIcon() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const icon = document.getElementById('themeToggle');
    if (icon) icon.textContent = isDark ? '🌞' : '🌙';
}
