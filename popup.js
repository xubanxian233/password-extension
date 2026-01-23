import { generatePassword, DEFAULT_CONFIG } from './utils.js';

// DOM Elements
const els = {
  // Views
  mainView: document.getElementById('main-view'),
  aboutView: document.getElementById('about-view'),

  // Buttons
  generateBtn: document.getElementById('generate-btn'),
  copyBtn: document.getElementById('copy-btn'),
  aboutBtn: document.getElementById('about-btn'),
  backBtn: document.getElementById('back-btn'),
  themeBtn: document.getElementById('theme-btn'),

  // Inputs
  length: document.getElementById('length'),
  lengthVal: document.getElementById('length-val'),
  useUppercase: document.getElementById('useUppercase'),
  useLowercase: document.getElementById('useLowercase'),
  useNumbers: document.getElementById('useNumbers'),
  useSymbols: document.getElementById('useSymbols'),
  includeChars: document.getElementById('includeChars'),
  excludeChars: document.getElementById('excludeChars'),
  themePicker: document.getElementById('theme-picker'),
  
  // Output
  output: document.getElementById('password-output'),
  statusMsg: document.getElementById('status-msg'),
  
  // Other
  authorLink: document.getElementById('author-link'),
};

// Current configuration state
let currentConfig = { ...DEFAULT_CONFIG };

// Apply theme color
function applyTheme(color) {
  if (!color) return;
  
  const root = document.documentElement;
  root.style.setProperty('--primary-color', color);
  
  // Calculate hover color (darken by ~10%)
  const darkenColor = (hex, percent) => {
    let num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };
  
  try {
    root.style.setProperty('--primary-hover-color', darkenColor(color, 10));
  } catch (e) {
    // Fallback if color format is invalid
    root.style.setProperty('--primary-hover-color', color);
  }
  
  // Update picker value if it's different and element exists
  if (els.themePicker && els.themePicker.value !== color) {
    els.themePicker.value = color;
  }
}

// Apply Internationalization
function localizeHtml() {
  // Localize text content
  const nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach(node => {
    const key = node.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) node.textContent = msg;
  });

  // Localize attributes (title, placeholder)
  const titleNodes = document.querySelectorAll('[data-i18n-title]');
  titleNodes.forEach(node => {
    const key = node.getAttribute('data-i18n-title');
    const msg = chrome.i18n.getMessage(key);
    if (msg) node.title = msg;
  });

  const placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderNodes.forEach(node => {
    const key = node.getAttribute('data-i18n-placeholder');
    const msg = chrome.i18n.getMessage(key);
    if (msg) node.placeholder = msg;
  });
}

function displayVersion() {
  const version = chrome.runtime.getManifest().version;
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = `v${version}`;
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('passwordConfig');
    if (result.passwordConfig) {
      currentConfig = { ...DEFAULT_CONFIG, ...result.passwordConfig };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  updateUI();
  
  // Apply theme if exists
  if (currentConfig.themeColor) {
    applyTheme(currentConfig.themeColor);
  }
  
  generate();
}

// Update UI elements based on currentConfig
function updateUI() {
  if (els.length) els.length.value = currentConfig.length;
  if (els.lengthVal) els.lengthVal.textContent = currentConfig.length;
  if (els.useUppercase) els.useUppercase.checked = currentConfig.useUppercase;
  if (els.useLowercase) els.useLowercase.checked = currentConfig.useLowercase;
  if (els.useNumbers) els.useNumbers.checked = currentConfig.useNumbers;
  if (els.useSymbols) els.useSymbols.checked = currentConfig.useSymbols;
  if (els.includeChars) els.includeChars.value = currentConfig.includeChars;
  if (els.excludeChars) els.excludeChars.value = currentConfig.excludeChars;
}

// Save settings to storage
function saveSettings() {
  chrome.storage.sync.set({ passwordConfig: currentConfig });
}

// Update config object from UI
function updateConfigFromUI() {
  if (els.length) currentConfig.length = parseInt(els.length.value, 10);
  if (els.useUppercase) currentConfig.useUppercase = els.useUppercase.checked;
  if (els.useLowercase) currentConfig.useLowercase = els.useLowercase.checked;
  if (els.useNumbers) currentConfig.useNumbers = els.useNumbers.checked;
  if (els.useSymbols) currentConfig.useSymbols = els.useSymbols.checked;
  if (els.includeChars) currentConfig.includeChars = els.includeChars.value;
  if (els.excludeChars) currentConfig.excludeChars = els.excludeChars.value;
  
  // Theme color is updated separately via applyTheme -> saveSettings
  if (els.themePicker) currentConfig.themeColor = els.themePicker.value;

  if (els.lengthVal) els.lengthVal.textContent = currentConfig.length;
  saveSettings();
}

function generate() {
  const pwd = generatePassword(currentConfig);
  if (els.output) els.output.value = pwd;
  if (els.statusMsg) els.statusMsg.textContent = "";
}

function copyToClipboard() {
  if (!els.output) return;
  const text = els.output.value;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const msgKey = "msgCopied";
    if (els.statusMsg) {
      els.statusMsg.textContent = chrome.i18n.getMessage(msgKey);
      setTimeout(() => {
        if (els.statusMsg) els.statusMsg.textContent = "";
      }, 2000);
    }
  }).catch(err => {
    console.error('Copy failed', err);
    if (els.statusMsg) els.statusMsg.textContent = "Error";
  });
}

function showAbout() {
  if (els.mainView) els.mainView.classList.add('hidden');
  if (els.aboutView) els.aboutView.classList.remove('hidden');
}

function showMain() {
  if (els.aboutView) els.aboutView.classList.add('hidden');
  if (els.mainView) els.mainView.classList.remove('hidden');
}

// Setup Event Listeners
function setupEventListeners() {
  // Add change listeners
  const inputElements = [
    els.length, 
    els.useUppercase, 
    els.useLowercase, 
    els.useNumbers, 
    els.useSymbols, 
    els.includeChars, 
    els.excludeChars
  ];

  inputElements.forEach(el => {
    if (el) {
      el.addEventListener('input', () => {
        updateConfigFromUI();
      });
    }
  });

  if (els.generateBtn) els.generateBtn.addEventListener('click', generate);
  if (els.copyBtn) els.copyBtn.addEventListener('click', copyToClipboard);
  if (els.aboutBtn) els.aboutBtn.addEventListener('click', showAbout);
  if (els.backBtn) els.backBtn.addEventListener('click', showMain);
  
  // Theme change
  if (els.themePicker) {
    els.themePicker.addEventListener('input', (e) => {
      applyTheme(e.target.value);
      updateConfigFromUI();
    });
  }
  
  // Trigger theme picker when clicking the theme button
  if (els.themeBtn && els.themePicker) {
    els.themeBtn.addEventListener('click', () => {
      els.themePicker.click();
    });
  }
  
  // Author link click
  if (els.authorLink) {
    els.authorLink.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.xxubanxian.cn/' });
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  localizeHtml();
  displayVersion();
  setupEventListeners(); // Setup listeners first
  loadSettings();        // Then load settings which will trigger UI update
});
