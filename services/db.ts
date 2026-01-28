
import { Student, AttendanceRecord } from '../types';
import { DB_NAME, STORE_STUDENTS, STORE_ATTENDANCE } from '../constants';

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
          db.createObjectStore(STORE_STUDENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ATTENDANCE)) {
          db.createObjectStore(STORE_ATTENDANCE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async saveStudent(student: Student): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORE_STUDENTS, 'readwrite');
      const request = store.put(student);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateStudent(student: Student): Promise<void> {
    return this.saveStudent(student);
  }

  async deleteStudent(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORE_STUDENTS, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStudents(): Promise<Student[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORE_STUDENTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAttendance(record: AttendanceRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORE_ATTENDANCE, 'readwrite');
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORE_ATTENDANCE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_STUDENTS, STORE_ATTENDANCE], 'readwrite');
      transaction.objectStore(STORE_STUDENTS).clear();
      transaction.objectStore(STORE_ATTENDANCE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async updateSyncStatus(storeName: string, id: string, status: 'synced' | 'error'): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const data = getReq.result;
        if (data) {
          data.sync_status = status;
          store.put(data);
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const localDb = new LocalDatabase();
