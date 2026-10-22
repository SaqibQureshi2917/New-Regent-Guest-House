import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmationDialog.module.css';

const ConfirmationDialog = ({ open, title = 'Are you sure?', description, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onClose }) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Close confirmation"><X size={18} /></button>
        <div className={`${styles.icon} ${tone === 'danger' ? styles.danger : styles.primary}`}><AlertTriangle size={22} /></div>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description">{description}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`${styles.confirm} ${tone === 'danger' ? styles.confirmDanger : ''}`} onClick={confirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmationDialog;
