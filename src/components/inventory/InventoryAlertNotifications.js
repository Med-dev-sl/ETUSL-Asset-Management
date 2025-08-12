import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Shows real-time, dismissible notifications for low/out-of-stock inventory items.
 * To be placed in the header for global visibility.
 */
const InventoryAlertNotifications = () => {
  const [open, setOpen] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Listen for low/out-of-stock inventory items
    const q = query(
      collection(db, 'inventory'),
      where('status', '==', 'low'),
      orderBy('quantity')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(items);
      setOpen(true); // Reopen if new alerts come in
    });
    return () => unsubscribe();
  }, []);

  if (!alerts.length) return null;

  // Compose alert message
  const outOfStock = alerts.filter(item => item.quantity === 0);
  const lowStock = alerts.filter(item => item.quantity > 0);
  let message = '';
  if (outOfStock.length) {
    message += `Out of stock: ${outOfStock.map(i => i.name).join(', ')}`;
  }
  if (lowStock.length) {
    if (message) message += ' | ';
    message += `Low stock: ${lowStock.map(i => `${i.name} (${i.quantity})`).join(', ')}`;
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={() => setOpen(false)}
      autoHideDuration={null} // Persist until dismissed
      sx={{ mt: 8 }}
    >
      <Alert
        severity="warning"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ width: '100%', fontWeight: 600 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default InventoryAlertNotifications;
