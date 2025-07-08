// SessionMate - options.js

document.addEventListener('DOMContentLoaded', () => {
  // Load current settings
  chrome.storage.local.get(['autoBackup', 'blacklist', 'password'], (result) => {
    document.getElementById('autoBackupToggle').checked = !!result.autoBackup;
    document.getElementById('blacklist').value = (result.blacklist || []).join('\n');
    document.getElementById('passwordInput').value = result.password || '';
  });

  // Save Auto Backup toggle
  document.getElementById('autoBackupToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ autoBackup: enabled }, () => {
      alert(`Auto-backup ${enabled ? 'enabled' : 'disabled'}.`);
    });
  });

  // Save Blacklist
  document.getElementById('saveBlacklistBtn').addEventListener('click', () => {
    const lines = document.getElementById('blacklist').value.split('\n').map(line => line.trim()).filter(Boolean);
    chrome.storage.local.set({ blacklist: lines }, () => {
      alert('Blacklist saved!');
    });
  });

  // Save Password
  document.getElementById('savePasswordBtn').addEventListener('click', () => {
    const pwd = document.getElementById('passwordInput').value;
    chrome.storage.local.set({ password: pwd }, () => {
      alert('Password saved!');
    });
  });
});
