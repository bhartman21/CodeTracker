const LOCATION_ENDPOINT = "https://api.va.gov/v0/profile/full_name";

export default function fetchLoginStatus() {
    let loginStatus: LoginStatusModel = new LoginStatusModel({});
    fetch(LOCATION_ENDPOINT)
        .then(response => response.json())
        .then(data => { 
            loginStatus = new LoginStatusModel({
                is_logged_in: true,
                first_name: data.first,
                middle_name: data.middle,
                last_name: data.last,
                suffix: data.suffix,
                full_name: data.first + ' ' + (data.middle ? data.middle + ' ' : '') + data.last + (data.suffix ? ', ' + data.suffix : '')
            });
            console.log(loginStatus.fullName);
        })
        .catch(error => {
            error.message = "You are not logged in. Please log in to the VA website.";
            loginStatus = new LoginStatusModel({
                is_logged_in: false,
                first_name: null,
                middle_name: null,
                last_name: null,
                suffix: null,
                full_name: error.message
            });
            console.log(error.message);
        })
        .finally(() => {
            // Store the login status in Chrome storage
            if (loginStatus) {
                chrome.storage.local.set({ loginStatus });
            }
        });

    return loginStatus;
}

export class LoginStatusModel {
    isLoggedIn: boolean = false;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    fullName: string | null;

    constructor({
        is_logged_in = false,
        first_name = null,
        middle_name = null,
        last_name = null,
        suffix = null, 
        full_name = ''
    }) {
        this.isLoggedIn = is_logged_in;
        this.firstName = first_name;
        this.middleName = middle_name;
        this.lastName = last_name;
        this.suffix = suffix;
        this.fullName = full_name;
    }
}

