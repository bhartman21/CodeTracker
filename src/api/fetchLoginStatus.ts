const LOCATION_ENDPOINT = "https://api.va.gov/v0/profile/full_name";

export default async function fetchLoginStatus(): Promise<LoginStatusModel> {
    try{
        const response = await fetch(LOCATION_ENDPOINT);
        var loginStatus = new LoginStatusModel();
        
        if (response.status === 200) {
            const data = await response.json();

            const first = data?.first ?? '';
            const middle = data?.middle ?? '';
            const last = data?.last ?? '';
            const suffix = data?.suffix ?? '';

            loginStatus = new LoginStatusModel({
                isLoggedIn: true,
                firstName: first,
                middleName: middle,
                lastName: last,
                suffix: suffix,
                fullName: `${first}${middle ? ' ' + middle : ''} ${last}${suffix ? ', ' + suffix : ''}`
            });

            chrome.storage.local.set({ loginStatus });
        } else {
            console.log(`HTTP ERROR! Status: ${response?.statusText}`);

            loginStatus = new LoginStatusModel({
                isLoggedIn: false,
                firstName: '',
                middleName: '',
                lastName: '',
                suffix: '',
                fullName: ''
            });

        }

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
