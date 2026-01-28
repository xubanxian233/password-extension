const DEFAULT_CONFIG = {
  length: 16,
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  useSymbols: true,
  includeChars: "",
  excludeChars: "0oO1iIlLq9g", // Default excluded chars to avoid confusion
  themeColor: "#8400ff"
};

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

function generatePassword(config) {
  // Merge provided config with defaults to ensure all keys exist
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  let allowedChars = "";
  let requiredChars = [];

  // 1. Build the pool of allowed characters
  if (cfg.useUppercase) allowedChars += CHAR_SETS.uppercase;
  if (cfg.useLowercase) allowedChars += CHAR_SETS.lowercase;
  if (cfg.useNumbers) allowedChars += CHAR_SETS.numbers;
  if (cfg.useSymbols) allowedChars += CHAR_SETS.symbols;

  // 2. Add specific included characters
  if (cfg.includeChars) {
    allowedChars += cfg.includeChars;
  }

  // 3. Remove excluded characters
  if (cfg.excludeChars) {
    const excludeSet = new Set(cfg.excludeChars.split(''));
    allowedChars = allowedChars.split('').filter(c => !excludeSet.has(c)).join('');
  }

  // Safety check: if pool is empty, return empty or default
  if (!allowedChars) return "";

  let password = "";

  // 4. Ensure we have at least one character from each selected type (if possible after exclusion)
  // This is a "best effort" to ensure complexity.
  // Helper to check if a char is available in the allowed pool
  const isAvailable = (char) => allowedChars.includes(char);

  if (cfg.useUppercase) {
    const valid = CHAR_SETS.uppercase.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useLowercase) {
    const valid = CHAR_SETS.lowercase.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useNumbers) {
    const valid = CHAR_SETS.numbers.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useSymbols) {
    const valid = CHAR_SETS.symbols.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  
  // Also ensure includeChars are present if possible
  if (cfg.includeChars) {
     const valid = cfg.includeChars.split('').filter(isAvailable);
     // We don't force ALL include chars, but we could mix them in. 
     // For now let's just treat them as part of the pool, but maybe ensure at least one?
     if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }

  // 5. Fill the rest
  // We need to fill (length - requiredChars.length)
  // But wait, if length is shorter than required, we truncate later.
  
  for (let i = 0; i < cfg.length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    password += allowedChars[randomIndex];
  }

  // 6. Inject required chars at random positions to ensure constraints are met
  // Note: This replaces random characters in the generated password with the required ones.
  if (requiredChars.length > 0) {
      const passwordArr = password.split('');
      // Shuffle required chars to avoid predictable order
      requiredChars.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < requiredChars.length && i < passwordArr.length; i++) {
          passwordArr[i] = requiredChars[i];
      }
      // Shuffle again to avoid required chars being at the start
      passwordArr.sort(() => Math.random() - 0.5);
      password = passwordArr.join('');
  }
  
  return password;
}

// Background Script Logic

// Ensure menus are created on install
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// Ensure menus are created on startup (sometimes needed for Firefox non-persistent scripts)
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
  // Clean up old menus first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // 1. Menu for Editable fields (Inputs, Textareas)
    chrome.contextMenus.create({
      id: "generate-and-insert",
      title: chrome.i18n.getMessage("menuInsert"),
      contexts: ["editable"]
    });

    // 2. Menu for everything else (Page, Link, etc.)
    chrome.contextMenus.create({
      id: "generate-and-copy",
      title: chrome.i18n.getMessage("menuCopy"),
      contexts: ["page", "link", "image", "video", "audio", "frame"]
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const isInsert = info.menuItemId === "generate-and-insert";
  const isCopy = info.menuItemId === "generate-and-copy";

  if (isInsert || isCopy) {
    // 1. Load config
    const result = await chrome.storage.sync.get('passwordConfig');
    const config = result.passwordConfig || DEFAULT_CONFIG;
    
    // 2. Generate
    const password = generatePassword(config);

    // 3. Inject script
    if (tab && tab.id) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: handlePasswordAction,
          args: [password, isInsert, {
            msgCopied: chrome.i18n.getMessage("msgCopied"),
            msgInsertedCopied: chrome.i18n.getMessage("msgInsertedCopied"),
            msgInsertFailed: chrome.i18n.getMessage("msgInsertFailed")
          }]
        });
      } catch (err) {
        console.error("Script injection failed: ", err);
      }
    }
  }
});

// This function runs INSIDE the web page
function handlePasswordAction(password, shouldInsert, messages) {
  // Helper to copy text
  function copyToClipboard(text) {
    function fallbackCopy(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        return false;
      }
      
      document.body.removeChild(textArea);
      return true;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch(err => {
          return fallbackCopy(text);
        });
    } else {
      return Promise.resolve(fallbackCopy(text));
    }
  }

  // Helper to show a temporary toast/tooltip
  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#333",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "4px",
      zIndex: "999999",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      fontSize: "14px",
      fontFamily: "sans-serif"
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = "opacity 0.5s";
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 2000);
  }

  if (shouldInsert) {
    const activeElement = document.activeElement;
    // Try to find the element that was right-clicked if activeElement is body
    // Note: 'contextMenus' click doesn't give us the element directly in MV3 executeScript args easily without frameId matching,
    // but usually the right-clicked element remains focused.
    
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
      // Try using execCommand 'insertText' first as it is more robust for undo/redo
      activeElement.focus();
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, password);
      } catch (e) {
        console.log('execCommand insertText failed, falling back to value assignment');
      }

      if (!inserted) {
        // Fallback to value assignment
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;
        
        activeElement.value = value.substring(0, start) + password + value.substring(end);
        
        // Move cursor to end of inserted text
        activeElement.selectionStart = activeElement.selectionEnd = start + password.length;
        // Trigger input event for frameworks like React/Vue
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Also copy to clipboard
      copyToClipboard(password).then(() => {
        showToast(messages.msgInsertedCopied);
      });
    } else {
      // Fallback if no input focused
      copyToClipboard(password).then(() => {
        showToast(messages.msgInsertFailed);
      });
    }
  } else {
    // Just copy
    copyToClipboard(password).then(() => {
      showToast(messages.msgCopied);
    });
  }
}
