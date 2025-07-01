import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.isInitialized = true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw new Error('Firebase initialization failed');
    }
  }

  sanitizeDataForFirestore(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'bigint') {
        sanitized[key] = value.toString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDataForFirestore(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  async saveContract(contractData) {
    if (!this.isInitialized) this.initialize();

    try {
      const docRef = await addDoc(collection(this.db, 'contracts'), {
        ...this.sanitizeDataForFirestore(contractData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving contract:', error);
      throw new Error(`Failed to save contract: ${error.message}`);
    }
  }

  async updateContract(contractId, updateData) {
    if (!this.isInitialized) this.initialize();

    try {
      const contractRef = doc(this.db, 'contracts', contractId);
      await updateDoc(contractRef, {
        ...this.sanitizeDataForFirestore(updateData),
        updatedAt: serverTimestamp()
      });
      
      return contractId;
    } catch (error) {
      console.error('Error updating contract:', error);
      throw new Error(`Failed to update contract: ${error.message}`);
    }
  }

  async getContracts(filters = {}) {
    if (!this.isInitialized) this.initialize();

    try {
      let q = collection(this.db, 'contracts');
      
      if (filters.network) {
        q = query(q, where('network', '==', filters.network));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw new Error(`Failed to fetch contracts: ${error.message}`);
    }
  }

  async getContractsByDeployer(deployerAddress) {
    if (!this.isInitialized) this.initialize();

    try {
      const q = query(
        collection(this.db, 'contracts'),
        where('deployer', '==', deployerAddress),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching contracts by deployer:', error);
      throw new Error(`Failed to fetch contracts: ${error.message}`);
    }
  }
}

export default new FirebaseService();
