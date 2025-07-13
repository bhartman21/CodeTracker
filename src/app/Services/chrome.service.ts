import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChromeService {
  constructor() {}

  // Chrome storage methods
  getFromStorage(key: string | string[]): Promise<any> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(key, (result) => {
          resolve(result);
        });
      } else {
        resolve({});
      }
    });
  }

  setToStorage(items: Object): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(items, resolve);
      } else {
        resolve();
      }
    });
  }

  removeFromStorage(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(keys, resolve);
      } else {
        resolve();
      }
    });
  }

  addStorageListener(listener: (changes: any, areaName: string) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(listener);
    }
  }

  removeStorageListener(listener: (changes: any, areaName: string) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.removeListener(listener);
    }
  }
}