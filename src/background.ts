import fetchClaims from './api/fetchClaims';
import fetchDisabilities from './api/fetchDisabilities';
import fetchLoginStatus from './api/fetchLoginStatus';

// Track extension startup to handle data persistence
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension starting up - checking data persistence settings');
    await checkDataPersistence();
    
    fetchLoginStatus();
    fetchDisabilities();
    fetchClaims();
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed - checking data persistence settings');
    await checkDataPersistence();
    
    fetchLoginStatus();
    fetchDisabilities();
    fetchClaims();
});

// Function to check if data should be cleared based on persistence settings
async function checkDataPersistence() {
    const localStorage = await chrome.storage.local.get(['persistDataOnClose']);
    const sessionData = await chrome.storage.session.get(['extensionWasOpen']);
    
    // If extension was previously open and persistence is disabled, check if we should clear data
    if (sessionData['extensionWasOpen'] && localStorage['persistDataOnClose'] === false) {
        const loginStatus = await fetchLoginStatus();
        
        // Clear data if user is logged out and persistence is disabled
        if (!loginStatus.isLoggedIn) {
            console.log('Extension reopened: User logged out with persistence disabled - clearing data');
            await chrome.storage.local.remove([
                'disabilities', 
                'claims', 
                'appeals', 
                'letters', 
                'disabilitiesUpdated', 
                'claimsUpdated', 
                'appealsUpdated', 
                'lettersUpdated'
            ]);
        }
    }
    
    // Mark that extension is now open
    chrome.storage.session.set({ extensionWasOpen: true });
}

// Handle extension suspension (when browser closes or extension is disabled)
chrome.runtime.onSuspend.addListener(() => {
    chrome.storage.local.get(['persistDataOnClose'], (result) => {
        if (result['persistDataOnClose'] === false) {
            // Clear all data if user chose not to persist
            chrome.storage.local.remove([
                'disabilities', 
                'claims', 
                'appeals', 
                'letters', 
                'disabilitiesUpdated', 
                'claimsUpdated', 
                'appealsUpdated', 
                'lettersUpdated'
            ]);
            console.log('Data cleared on extension close');
        }
    });
});
