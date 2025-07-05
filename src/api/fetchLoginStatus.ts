const LOCATION_ENDPOINT = "https://api.va.gov/v0/profile/full_name";

export default async function fetchLoginStatus(): Promise<LoginStatusModel> {
    try{
        const response = await fetch(LOCATION_ENDPOINT);
        
        if(!response.ok) {
            throw new Error(`HTTP ERROR! Status: ${response.status}`)
        }

        const data = await response.json();

        const loginStatus = new LoginStatusModel({
            isLoggedIn: true,
            firstName: data.first,
            middleName: data.middle,
            lastName: data.last,
            suffix: data.suffix,
            fullName: data.first + ' ' + (data.middle ? data.middle + ' ' : '') + data.last + (data.suffix ? ', ' + data.suffix : '')
        });
        
        console.log('Login successful:', loginStatus.fullName);
        
        // Store the login status in Chrome storage
        chrome.storage.local.set({ loginStatus });
        
        return loginStatus;
    } catch (error) {
        console.error('Login check failed:', error);
        
        const loginStatus = new LoginStatusModel({
            isLoggedIn: false,
            firstName: null,
            middleName: null,
            lastName: null,
            suffix: null,
            fullName: "You are not logged in. Please log in to the VA website."
        });
        
        // Store the login status in Chrome storage
        chrome.storage.local.set({ loginStatus });
        
        return loginStatus;
    }
}

export class LoginStatusModel {
    isLoggedIn: boolean = false;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    fullName: string | null;

    constructor({
        isLoggedIn = false,
        firstName = null,
        middleName = null,
        lastName = null,
        suffix = null, 
        fullName = ''
    }: {
        isLoggedIn?: boolean;
        firstName?: string | null;
        middleName?: string | null;
        lastName?: string | null;
        suffix?: string | null;
        fullName?: string | null;
    } = {}) {
        this.isLoggedIn = isLoggedIn;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.suffix = suffix;
        this.fullName = fullName;
    }
}
