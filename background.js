import { generatePassword, DEFAULT_CONFIG } from './utils.js';

chrome.runtime.onInstalled.addListener(() => {
  // Clean up old menus
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
});

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
      zIndex: "100000",
      fontSize: "14px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      opacity: "0",
      transition: "opacity 0.3s ease"
    });
    
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.style.opacity = "1";
    
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  // Logic Flow
  if (shouldInsert) {
    // Try to insert into active element
    const activeEl = document.activeElement;
    let inserted = false;
    
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      activeEl.focus();
      inserted = document.execCommand('insertText', false, password);
      
      if (!inserted) {
        try {
            const start = activeEl.selectionStart;
            const end = activeEl.selectionEnd;
            const val = activeEl.value;
            activeEl.value = val.slice(0, start) + password + val.slice(end);
            activeEl.selectionStart = activeEl.selectionEnd = start + password.length;
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            inserted = true;
        } catch(e) {
            console.error("Insert fallback failed", e);
        }
      }
    }
    
    copyToClipboard(password).then(() => {
        showToast(inserted ? messages.msgInsertedCopied : messages.msgInsertFailed);
    });

  } else {
    // Just Copy
    copyToClipboard(password).then(() => {
      showToast(messages.msgCopied);
    });
  }
}
