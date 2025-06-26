import fetchDisabilities from './api/fetchDisabilities';

// Call the function when the extension starts or when needed
chrome.runtime.onStartup.addListener(() => {
    fetchDisabilities();
});

// Or call it when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    fetchDisabilities();
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
