(() => {
  const params = new URLSearchParams(window.location.search);
  const editRequested = /\/edit\/?$/.test(window.location.pathname) || params.get('edit') === '1' || window.location.hash === '#edit';
  if (!editRequested) return;

  const PASSWORD = 'AdminCanEdit';
  const pageRoot = document.querySelector('.container, .page') || document.body;

  const style = document.createElement('style');
  style.textContent = `
    .edit-lock {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(10, 10, 8, 0.62);
      backdrop-filter: blur(10px);
    }
    .edit-panel,
    .edit-toolbar {
      border: 1px solid var(--border2, var(--border-strong, rgba(0,0,0,0.16)));
      border-radius: 12px;
      background: var(--surface, #fff);
      color: var(--text, #18180f);
      box-shadow: 0 18px 54px rgba(0,0,0,0.22);
      font-family: var(--sans, 'DM Sans', sans-serif);
    }
    .edit-panel {
      width: min(420px, 100%);
      padding: 22px;
    }
    .edit-title {
      margin-bottom: 6px;
      font-size: 18px;
      font-weight: 700;
    }
    .edit-copy {
      margin-bottom: 16px;
      color: var(--text2, var(--muted, #777));
      font-size: 13px;
      line-height: 1.55;
    }
    .edit-password {
      width: 100%;
      margin-bottom: 10px;
      padding: 11px 12px;
      border: 1px solid var(--border2, var(--border-strong, rgba(0,0,0,0.16)));
      border-radius: 8px;
      background: var(--bg, #f4f3ee);
      color: var(--text, #18180f);
      font: inherit;
    }
    .edit-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .edit-btn {
      border: 1px solid var(--border2, var(--border-strong, rgba(0,0,0,0.16)));
      border-radius: 999px;
      background: var(--surface2, #eee);
      color: var(--text, #18180f);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 13px;
    }
    .edit-btn.primary {
      background: var(--green, #1a8c62);
      border-color: var(--green, #1a8c62);
      color: var(--on-green, #fff);
    }
    .edit-error {
      min-height: 18px;
      color: var(--red, #c0442a);
      font-size: 12px;
      margin-top: 8px;
    }
    .edit-toolbar {
      position: fixed;
      left: 50%;
      bottom: 16px;
      z-index: 999;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: calc(100vw - 24px);
      padding: 8px;
      transform: translateX(-50%);
    }
    .edit-toolbar span {
      color: var(--text2, var(--muted, #777));
      font-size: 12px;
      white-space: nowrap;
      padding: 0 6px;
    }
    .edit-active [contenteditable="true"] {
      outline: 1px dashed var(--green, #1a8c62);
      outline-offset: 8px;
    }
    @media (max-width: 640px) {
      .edit-toolbar {
        align-items: stretch;
        flex-direction: column;
        width: calc(100vw - 24px);
      }
      .edit-toolbar span { text-align: center; }
      .edit-btn { width: 100%; }
    }
  `;
  document.head.appendChild(style);

  const lock = document.createElement('div');
  lock.className = 'edit-lock';
  lock.innerHTML = `
    <form class="edit-panel">
      <div class="edit-title">Editor access</div>
      <div class="edit-copy">Enter the admin password to edit this page in the browser.</div>
      <input class="edit-password" type="password" autocomplete="current-password" placeholder="Password">
      <div class="edit-actions">
        <button class="edit-btn primary" type="submit">Unlock editing</button>
        <button class="edit-btn" type="button" data-edit-cancel>Cancel</button>
      </div>
      <div class="edit-error" aria-live="polite"></div>
    </form>
  `;
  document.body.appendChild(lock);

  const form = lock.querySelector('form');
  const input = lock.querySelector('input');
  const error = lock.querySelector('.edit-error');
  const cancel = lock.querySelector('[data-edit-cancel]');
  input.focus();

  cancel.addEventListener('click', () => {
    window.location.href = window.location.pathname.replace(/\/edit\/?$/, '') || './';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value !== PASSWORD) {
      error.textContent = 'Incorrect password.';
      input.select();
      return;
    }
    unlockEditMode(lock);
  });

  function unlockEditMode(lockNode) {
    lockNode.remove();
    document.body.classList.add('edit-active');
    pageRoot.setAttribute('contenteditable', 'true');
    pageRoot.spellcheck = false;

    const toolbar = document.createElement('div');
    toolbar.className = 'edit-toolbar';
    toolbar.setAttribute('contenteditable', 'false');
    toolbar.innerHTML = `
      <span>Editing enabled</span>
      <button class="edit-btn primary" type="button" data-download>Download edited HTML</button>
      <button class="edit-btn" type="button" data-lock>Lock</button>
    `;
    document.body.appendChild(toolbar);

    toolbar.querySelector('[data-download]').addEventListener('click', () => {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('.edit-toolbar, .edit-lock').forEach((node) => node.remove());
      clone.querySelectorAll('[contenteditable]').forEach((node) => node.removeAttribute('contenteditable'));
      clone.querySelector('body')?.classList.remove('edit-active');
      const blob = new Blob(['<!DOCTYPE html>\n' + clone.outerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const pageName = (location.pathname.split('/').filter(Boolean).pop() || 'index').replace(/\.html$/, '');
      a.href = url;
      a.download = `${pageName}-edited.html`;
      a.click();
      URL.revokeObjectURL(url);
    });

    toolbar.querySelector('[data-lock]').addEventListener('click', () => {
      pageRoot.removeAttribute('contenteditable');
      document.body.classList.remove('edit-active');
      toolbar.remove();
    });
  }
})();
