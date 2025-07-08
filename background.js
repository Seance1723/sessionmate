// SessionMate - background.js

// Log every visited page, grouped day-wise
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    logHistory(tab);
  }
});

function logHistory(tab) {
  chrome.storage.local.get(['dailyHistory', 'blacklist'], (result) => {
    const blacklist = result.blacklist || [];
    const url = new URL(tab.url);
    const domain = url.hostname;

    if (blacklist.includes(domain)) {
      console.log(`SessionMate: Skipped blacklisted domain: ${domain}`);
      return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const entry = {
      url: tab.url,
      title: tab.title || '',
      timestamp: Date.now(),
      windowId: tab.windowId,
      tabId: tab.id
    };

    const dailyHistory = result.dailyHistory || {};
    if (!dailyHistory[today]) dailyHistory[today] = [];
    dailyHistory[today].push(entry);

    chrome.storage.local.set({ dailyHistory: dailyHistory });
    console.log('SessionMate: Logged entry for', today, entry);
  });
}

// Listen for manual save/restore
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveSession') {
    saveSession(message.sessionName);
  } else if (message.action === 'restoreSession') {
    restoreSession(message.sessionName);
  }
});

// Save all open windows/tabs, name includes date
function saveSession(customName) {
  chrome.windows.getAll({ populate: true }, (windows) => {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().getTime();
    const sessionName = customName && customName.trim().length > 0
      ? `${customName} - ${today}`
      : `Session-${today}-${timestamp}`;

    const session = {
      name: sessionName,
      savedAt: Date.now(),
      windows: windows.map(win => ({
        tabs: win.tabs.map(tab => ({ url: tab.url }))
      }))
    };

    chrome.storage.local.get(['savedSessions'], (result) => {
      const sessions = result.savedSessions || [];
      sessions.push(session);
      chrome.storage.local.set({ savedSessions: sessions }, () => {
        console.log('SessionMate: Session saved', session);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'SessionMate',
          message: `Session "${sessionName}" saved successfully!`
        });
      });
    });
  });
}

// Restore a session by name
function restoreSession(sessionName) {
  chrome.storage.local.get(['savedSessions'], (result) => {
    const sessions = result.savedSessions || [];
    const session = sessions.find(s => s.name === sessionName);
    if (session) {
      session.windows.forEach(win => {
        chrome.windows.create({ url: win.tabs.map(tab => tab.url) });
      });
      console.log('SessionMate: Session restored', session);
    }
  });
}

// Auto-backup every 1 hour
chrome.alarms.create('autoBackup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'autoBackup') {
    saveSession();
    console.log('SessionMate: Auto-backup triggered');
  }
});

// Context menu for quick save
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveSessionMenu',
    title: 'Save Session (SessionMate)',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'saveSessionMenu') {
    saveSession();
  }
});
