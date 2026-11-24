export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'trendhive-theme';
export const readTheme = (value: string | null): Theme => value === 'light' ? 'light' : 'dark';

// Runs in <head> before the page can paint; never consults system preferences.
export const themeInitializationScript = '(function(){var theme="dark";try{if(window.localStorage.getItem(' + JSON.stringify(THEME_STORAGE_KEY) + ')==="light")theme="light"}catch(e){}document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;})();';
