import { db } from './config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const initializeSettings = async (userId) => {
  try {
    // Initialize system settings
    await setDoc(doc(db, 'systemSettings', 'general'), {
      universityName: '',
      timeZone: 'UTC',
      emailDomain: '',
      logo: null,
      contactEmail: '',
      contactPhone: '',
      address: '',
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    }, { merge: true });

    // Initialize notification settings
    await setDoc(doc(db, 'settings', 'notifications'), {
      emailNotifications: {
        enabled: false,
        newAsset: true,
        assetAssignment: true,
        assetReturn: true,
        lowStock: true,
        maintenanceReminder: true
      },
      smsNotifications: {
        enabled: false,
        urgentAlerts: true,
        phoneNumber: ''
      },
      emailTemplates: {
        assetAssignment: 'Dear {userName},\n\nAn asset ({assetName}) has been assigned to you on {date}.',
        assetReturn: 'Dear {userName},\n\nThis is to confirm the return of asset ({assetName}) on {date}.',
        lowStockAlert: 'Alert: Low stock level detected for {assetName} at {location}.',
        maintenanceReminder: 'Maintenance required for {assetName} scheduled on {date}.'
      },
      updatedAt: serverTimestamp(),
      updatedBy: userId
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error initializing settings:', error);
    return { success: false, error };
  }
};

export const validateSettings = {
  system: (settings) => {
    const requiredFields = ['universityName', 'timeZone', 'emailDomain', 'contactEmail'];
    const missingFields = requiredFields.filter(field => !settings[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.contactEmail)) {
      throw new Error('Invalid contact email format');
    }
    
    // Validate phone format (optional)
    if (settings.contactPhone && !/^\+?[\d\s-]+$/.test(settings.contactPhone)) {
      throw new Error('Invalid phone number format');
    }
    
    return true;
  },

  notifications: (settings) => {
    if (settings.smsNotifications.enabled && !settings.smsNotifications.phoneNumber) {
      throw new Error('Phone number is required when SMS notifications are enabled');
    }

    if (settings.emailNotifications.enabled) {
      // Validate email templates
      const requiredTemplates = ['assetAssignment', 'assetReturn', 'lowStockAlert', 'maintenanceReminder'];
      const missingTemplates = requiredTemplates.filter(
        template => !settings.emailTemplates[template]
      );

      if (missingTemplates.length > 0) {
        throw new Error(`Missing email templates: ${missingTemplates.join(', ')}`);
      }
    }

    return true;
  }
};
