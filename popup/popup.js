// SessionMate - popup.js

// 1️⃣ On load: password lock
chrome.storage.local.get(['password'], (result) => {
  const savedPassword = result.password;
  if (savedPassword && savedPassword.length > 0) {
    const input = prompt('Enter SessionMate Password:');
    if (input !== savedPassword) {
      alert('Incorrect password.');
      window.close();
    }
  }
});

// 2️⃣ Save Session
// SessionMate - popup.js
document.getElementById('saveSessionBtn').addEventListener('click', () => {
  const sessionName = prompt('Enter a name for this session (optional):');
  chrome.runtime.sendMessage({ action: 'saveSession', sessionName: sessionName });
});


// 3️⃣ Restore Last Session
document.getElementById('restoreSessionBtn').addEventListener('click', () => {
  chrome.storage.local.get(['savedSessions'], (result) => {
    const sessions = result.savedSessions || [];
    if (sessions.length === 0) {
      alert('No saved sessions found.');
      return;
    }

    const lastSession = sessions[sessions.length - 1];
    chrome.runtime.sendMessage({
      action: 'restoreSession',
      sessionName: lastSession.name
    });
  });
});

// 4️⃣ Export Sessions
document.getElementById('exportSessionsBtn').addEventListener('click', () => {
  chrome.storage.local.get(['savedSessions'], (result) => {
    const sessions = result.savedSessions || [];
    const blob = new Blob(
      [JSON.stringify(sessions, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: `SessionMate_Sessions_${new Date().toISOString()}.json`
    });
  });
});

// 5️⃣ Import Sessions
document.getElementById('importSessionsBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedSessions = JSON.parse(e.target.result);
      chrome.storage.local.get(['savedSessions'], (result) => {
        const existing = result.savedSessions || [];
        const merged = existing.concat(importedSessions);
        chrome.storage.local.set({ savedSessions: merged }, () => {
          alert('Sessions imported successfully!');
        });
      });
    } catch (error) {
      alert('Invalid file format.');
    }
  };
  reader.readAsText(file);
});

// 6️⃣ Show sessions list with day labels
chrome.storage.local.get(['savedSessions'], (result) => {
  const list = document.getElementById('sessionsList');
  const sessions = result.savedSessions || [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);
  const dayBeforeStr = dayBefore.toISOString().split('T')[0];

  sessions.slice().reverse().forEach(session => {
    const parts = session.name.split('-');
    const sessionDate = parts[1] || '';

    let label = '';
    if (sessionDate === todayStr) {
      label = 'Today';
    } else if (sessionDate === yesterdayStr) {
      label = 'Yesterday';
    } else if (sessionDate === dayBeforeStr) {
      const dayName = dayBefore.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      label = dayName;
    } else {
      const date = new Date(session.savedAt);
      label = date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
    }

    const li = document.createElement('li');
    li.textContent = `${label} — ${new Date(session.savedAt).toLocaleTimeString()}`;
    list.appendChild(li);
  });
});
