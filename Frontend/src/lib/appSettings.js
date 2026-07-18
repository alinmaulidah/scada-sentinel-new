const SETTINGS_KEY = "pipeline-analytica-settings";

export const DEFAULT_APP_SETTINGS = {
  darkMode: false,
  autoRefresh: true,
  aiDetection: true,
};

export const getAppSettings = () => {
  try {
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
};

export const applyTheme = (darkMode) => {
  document.documentElement.dataset.theme = darkMode ? "dark" : "light";
};

export const saveAppSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyTheme(settings.darkMode);
  window.dispatchEvent(new CustomEvent("pipeline-settings-changed", { detail: settings }));
};
