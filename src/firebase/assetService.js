import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

const ASSETS_COLLECTION = 'assets';
const ASSET_HISTORY_COLLECTION = 'assetHistory';

export const addAsset = async (assetData) => {
  try {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const docRef = await addDoc(assetsRef, {
      ...assetData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Add initial history entry
    await addAssetHistory(docRef.id, {
      type: 'created',
      details: 'Asset added to the system',
      changes: assetData
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding asset:', error);
    throw new Error('Failed to add asset: ' + error.message);
  }
};

export const updateAsset = async (assetId, updates) => {
  try {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);
    const assetSnap = await getDoc(assetRef);
    
    if (!assetSnap.exists()) {
      throw new Error('Asset not found');
    }

    const oldData = assetSnap.data();
    await updateDoc(assetRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Record the update in history
    await addAssetHistory(assetId, {
      type: 'updated',
      details: 'Asset information updated',
      changes: {
        before: oldData,
        after: updates
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating asset:', error);
    throw new Error('Failed to update asset: ' + error.message);
  }
};

export const getAssets = async (filters = {}) => {
  try {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    let q = assetsRef;

    // Apply filters
    if (filters.status) {
      q = query(assetsRef, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    const assets = [];
    querySnapshot.forEach((doc) => {
      assets.push({ id: doc.id, ...doc.data() });
    });

    return assets;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets: ' + error.message);
  }
};

export const getAssetById = async (assetId) => {
  try {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);
    const assetSnap = await getDoc(assetRef);

    if (!assetSnap.exists()) {
      throw new Error('Asset not found');
    }

    return { id: assetSnap.id, ...assetSnap.data() };
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw new Error('Failed to fetch asset: ' + error.message);
  }
};

export const disposeAsset = async (assetId, disposalDetails) => {
  try {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);
    const assetSnap = await getDoc(assetRef);

    if (!assetSnap.exists()) {
      throw new Error('Asset not found');
    }

    await updateDoc(assetRef, {
      status: 'disposed',
      disposalDetails,
      disposedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Record the disposal in history
    await addAssetHistory(assetId, {
      type: 'disposed',
      details: 'Asset marked as disposed',
      changes: disposalDetails
    });

    return { success: true };
  } catch (error) {
    console.error('Error disposing asset:', error);
    throw new Error('Failed to dispose asset: ' + error.message);
  }
};

const addAssetHistory = async (assetId, historyEntry) => {
  try {
    const historyRef = collection(db, ASSET_HISTORY_COLLECTION);
    await addDoc(historyRef, {
      assetId,
      ...historyEntry,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding asset history:', error);
    // Don't throw here to prevent main operations from failing
  }
};

export const getAssetHistory = async (assetId) => {
  try {
    const historyRef = collection(db, ASSET_HISTORY_COLLECTION);
    const q = query(historyRef, where('assetId', '==', assetId));
    const querySnapshot = await getDocs(q);
    
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching asset history:', error);
    throw new Error('Failed to fetch asset history: ' + error.message);
  }
};
