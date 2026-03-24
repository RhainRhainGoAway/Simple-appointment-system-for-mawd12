/*
 * alerts.js - Unified, styled alerts/confirm dialogs (no native alert/confirm)
 *
 * Usage:
 *   appAlert('Message', { title: 'Title', variant: 'primary|danger' })
 *   const ok = await appConfirm('Are you sure?', { title: 'Confirm', variant: 'danger', okText: 'Yes', cancelText: 'No' })
 */

(function () {
    const OVERLAY_ID = 'appDialogOverlay';
    const FLASH_KEY = 'appFlashMessage';

    let queue = Promise.resolve();

    function ensureDialogDom() {
        if (document.getElementById(OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'app-dialog-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
            <div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="appDialogTitle">
                <div class="app-dialog__header">
                    <div class="app-dialog__title" id="appDialogTitle">Notice</div>
                    <button type="button" class="app-dialog__close" aria-label="Close">&times;</button>
                </div>
                <div class="app-dialog__body">
                    <div class="app-dialog__message" id="appDialogMessage"></div>
                </div>
                <div class="app-dialog__footer" id="appDialogFooter"></div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    function setVariantClasses(dialogEl, variant) {
        const v = (variant || 'primary').toLowerCase();
        dialogEl.classList.remove('variant-primary', 'variant-danger');
        dialogEl.classList.add(v === 'danger' ? 'variant-danger' : 'variant-primary');
    }

    function openDialog({
        title,
        message,
        variant,
        mode,
        okText,
        cancelText
    }) {
        ensureDialogDom();

        const overlay = document.getElementById(OVERLAY_ID);
        const dialog = overlay.querySelector('.app-dialog');
        const titleEl = document.getElementById('appDialogTitle');
        const messageEl = document.getElementById('appDialogMessage');
        const footer = document.getElementById('appDialogFooter');
        const closeBtn = overlay.querySelector('.app-dialog__close');

        setVariantClasses(dialog, variant);

        titleEl.textContent = title || (mode === 'confirm' ? 'Confirm' : 'Notice');

        // Preserve line breaks.
        messageEl.textContent = message == null ? '' : String(message);

        footer.innerHTML = '';

        const okButton = document.createElement('button');
        okButton.type = 'button';
        okButton.className = 'app-dialog__btn app-dialog__btn--primary';
        okButton.textContent = okText || (mode === 'confirm' ? 'Confirm' : 'OK');

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'app-dialog__btn app-dialog__btn--secondary';
        cancelButton.textContent = cancelText || 'Cancel';

        if (mode === 'confirm') {
            footer.appendChild(cancelButton);
            footer.appendChild(okButton);
        } else {
            footer.appendChild(okButton);
        }

        overlay.style.display = 'flex';
        // Let CSS transition apply
        requestAnimationFrame(() => overlay.classList.add('show'));

        const previouslyFocused = document.activeElement;
        okButton.focus();

        return new Promise((resolve) => {
            let resolved = false;

            const cleanup = (result) => {
                if (resolved) return;
                resolved = true;

                overlay.classList.remove('show');
                // match CSS transition duration
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 200);

                document.removeEventListener('keydown', onKeyDown);
                overlay.removeEventListener('click', onOverlayClick);
                closeBtn.removeEventListener('click', onClose);
                okButton.removeEventListener('click', onOk);
                cancelButton.removeEventListener('click', onCancel);

                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }

                resolve(result);
            };

            const onOk = () => cleanup(mode === 'confirm');
            const onCancel = () => cleanup(false);
            const onClose = () => cleanup(mode === 'confirm' ? false : true);

            const onOverlayClick = (e) => {
                if (e.target !== overlay) return;
                // Click outside acts like close.
                onClose();
            };

            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                    return;
                }

                // Simple focus trap
                if (e.key === 'Tab') {
                    const focusables = Array.from(overlay.querySelectorAll('button')).filter(b => !b.disabled);
                    if (focusables.length === 0) return;

                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];

                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            };

            closeBtn.addEventListener('click', onClose);
            okButton.addEventListener('click', onOk);
            cancelButton.addEventListener('click', onCancel);
            overlay.addEventListener('click', onOverlayClick);
            document.addEventListener('keydown', onKeyDown);
        });
    }

    function enqueueOpen(opts) {
        queue = queue.then(() => openDialog(opts));
        return queue;
    }

    // Public API
    window.appAlert = function appAlert(message, options = {}) {
        return enqueueOpen({
            title: options.title,
            message,
            variant: options.variant || 'primary',
            mode: 'alert',
            okText: options.okText || 'OK'
        });
    };

    window.appConfirm = function appConfirm(message, options = {}) {
        return enqueueOpen({
            title: options.title,
            message,
            variant: options.variant || 'primary',
            mode: 'confirm',
            okText: options.okText || 'Confirm',
            cancelText: options.cancelText || 'Cancel'
        });
    };

    // Flash message helper (for redirects)
    window.setAppFlash = function setAppFlash(message, options = {}) {
        try {
            sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, options }));
        } catch {
            // ignore
        }
    };

    function consumeFlash() {
        try {
            const raw = sessionStorage.getItem(FLASH_KEY);
            if (!raw) return;
            sessionStorage.removeItem(FLASH_KEY);

            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.message) return;

            // show after DOM is ready
            enqueueOpen({
                title: parsed.options?.title,
                message: parsed.message,
                variant: parsed.options?.variant || 'primary',
                mode: 'alert',
                okText: parsed.options?.okText || 'OK'
            });
        } catch {
            // ignore
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', consumeFlash);
    } else {
        consumeFlash();
    }
})();
