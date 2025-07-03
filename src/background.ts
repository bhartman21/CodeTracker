import fetchClaims from './api/fetchClaims';
import fetchDisabilities from './api/fetchDisabilities';
import fetchLoginStatus from './api/fetchLoginStatus';

// Call the function when the extension starts or when needed
chrome.runtime.onStartup.addListener(() => {
    fetchLoginStatus();
    fetchDisabilities();
    fetchClaims();
});

// Or call it when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    fetchLoginStatus();
    fetchDisabilities();
    fetchClaims();
});

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.webNavigation.onCompleted.addListener(() => {
//     chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
//       if (id) {
//         chrome.action.disable(id);
//       }
//     });
//   }, { url: [{ hostContains: 'google.com' }] });
// });
