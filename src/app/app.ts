import { AfterViewInit, Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import fetchDisabilities, { DisabilityModel, IndividualRatingModel } from '../api/fetchDisabilities';
import fetchLoginStatus, { LoginStatusModel } from '../api/fetchLoginStatus';
import fetchClaims, { ClaimModel } from '../api/fetchClaims';
import { ChromeService } from './Services/chrome.service';
import fetchAppeals, { AppealModel, AppealIssue } from '../api/fetchAppeals';
import fetchLetters, { ClaimLetterModel } from '../api/fetchLetters';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {

    isLoggedIn: boolean = false;
    currentSort: any = { column: '', direction: 'asc' };
    viewerType: string = 'Disability';
    lastUpdated: string = '';
    
    combinedRating: string = '---';
    disabilityRatings: IndividualRatingModel[] = [];
    claims: ClaimModel[] = [];   
    appeals: AppealModel[] = [];
    letters: ClaimLetterModel[] = [];

    @ViewChild('issuesModal') issuesModal!: ElementRef;

    constructor(
        private cdr: ChangeDetectorRef,
        private chromeService: ChromeService, 
        private ngZone: NgZone
    ) {
        this.checkLoginStatus();
    }

    private async checkLoginStatus() {
        try {
            // Always fetch the login status directly, do not use chrome.storage
            const status = await fetchLoginStatus();
            this.isLoggedIn = status.isLoggedIn;
            this.cdr.detectChanges();
            console.log('Login status updated:', this.isLoggedIn);
        } catch (error) {
            this.isLoggedIn = false;
            console.log('Error checking login status:', error);
            this.cdr.detectChanges();
        }
    }

    private updateLastUpdated() {
        this.lastUpdated = '';

        if (this.viewerType === 'Disability') {
            chrome.storage.local.get(['disabilitiesUpdated'], (result) => {
                this.lastUpdated = result['disabilitiesUpdated'] || new Date().toLocaleString();
            });
        } else if (this.viewerType === 'Claims') {
            chrome.storage.local.get(['claimsUpdated'], (result) => {
                this.lastUpdated = result['claimsUpdated'] || new Date().toLocaleString();
            });
        } else if (this.viewerType === 'Appeals') {
            chrome.storage.local.get(['appealsUpdated'], (result) => {
                this.lastUpdated = result['appealsUpdated'] || new Date().toLocaleString();
            });
        } else if (this.viewerType === 'Letters') {
            chrome.storage.local.get(['lettersUpdated'], (result) => {
                this.lastUpdated = result['lettersUpdated'] || new Date().toLocaleString();
            });
        }
    }

    private showEmptyDisabilityTable() {
        this.disabilityRatings = [];
    }

    private showEmptyClaimsTable() {
        this.claims = [];
    }

    private showEmptyAppealsTable() {
        this.appeals = [];
    }

    private showEmptyLettersTable() {
        this.letters = [];
    }

    async ngOnInit(): Promise<void> {
        const result = await this.chromeService.getFromStorage(['currentViewType']);
        if (result['currentViewType']) {
            this.viewerType = result['currentViewType'];
        }
        
        if (this.viewerType === 'Disability') {
            this.populateDisabilityTable();
        } else if (this.viewerType === 'Claims') {
            this.populateClaimsTable();
        } else if (this.viewerType === 'Appeals') {
            this.populateAppealsTable();
        } else if (this.viewerType === 'Letters') {
            this.populateLettersTable();
        }
        
        this.cdr.detectChanges();
        
        setInterval(() => {
            this.checkLoginStatus();
        }, 60000);
    }

    ngAfterViewInit() {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
            // Initialize the tables based on current view type
            if (this.viewerType === 'Disability') {
                this.populateDisabilityTable();
            } else if (this.viewerType === 'Claims') {
                this.populateClaimsTable();
            } else if (this.viewerType === 'Appeals') {
                this.populateAppealsTable();
            } else if (this.viewerType === 'Letters') {
                this.populateLettersTable();
            }
        }, 100);
    }

    public navigateToVA(): void {
        window.open('https://www.va.gov/', 'VALogin');
    }

    public navigateTipJar(): void {
        window.open('https://tiptopjar.com/bhartman21', '_tipJar');
    }

    public switchViewer(type: string): void {
        this.viewerType = type;
        chrome.storage.local.set({ currentViewType: type });

        if (type === 'Disability') {
            this.populateDisabilityTable();
        } else if (type === 'Claims') {
            this.populateClaimsTable();
        }

        this.cdr.detectChanges();
    }

    populateDisabilityTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['disabilities'], (result) => {
            this.ngZone.run(() => {
                if (result['disabilities']) {
                    const disabilities: DisabilityModel = result['disabilities'] || [];
                    this.disabilityRatings = disabilities.individualRatings || [];
                    this.combinedRating = disabilities.combinedRating ? `${disabilities.combinedRating}%` : '---';

                    this.chromeService.getFromStorage(['disabilitiesUpdated']).then((res) => {
                        this.lastUpdated = res['disabilitiesUpdated'] || new Date().toLocaleString();
                        this.cdr.detectChanges();
                    });
                } else {
                    this.showEmptyDisabilityTable();
                        this.cdr.detectChanges();
                }
            });
        });
    }

    populateClaimsTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['claims'], (result) => {
            this.ngZone.run(() => {
                if (result['claims']) {
                    const claims: ClaimModel[] = result['claims'];
                    this.claims = claims ?? [];

                    this.chromeService.getFromStorage(['claimsUpdated']).then((res) => {
                        this.lastUpdated = res['claimsUpdated'] || new Date().toLocaleString();
                        this.cdr.detectChanges();
                    });
                } else {
                    this.showEmptyClaimsTable();
                        this.cdr.detectChanges();
                }
            });
        });
    }

    populateAppealsTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['appeals'], (result) => {
            this.ngZone.run(() => {
                if (result['appeals']) {
                    const appeals: AppealModel[] = result['appeals'];
                    this.appeals = appeals ?? [];

                    this.chromeService.getFromStorage(['appealsUpdated']).then((res) => {
                        this.lastUpdated = res['appealsUpdated'] || new Date().toLocaleString();
                        this.cdr.detectChanges();
                    });
                } else {
                    this.showEmptyAppealsTable();
                        this.cdr.detectChanges();
                }
            });
        });
    }

    populateLettersTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['letters'], (result) => {
            this.ngZone.run(() => {
                if (result['letters']) {
                    const letters: ClaimLetterModel[] = result['letters'];
                    this.letters = letters ?? [];

                    this.chromeService.getFromStorage(['lettersUpdated']).then((res) => {
                        this.lastUpdated = res['lettersUpdated'] || new Date().toLocaleString();
                        this.cdr.detectChanges();
                    });
                } else {
                    this.showEmptyLettersTable();
                        this.cdr.detectChanges();
                }
            });
        });
        console.log('Letters populated:', this.letters);
    }    

    handleRefreshClick() {
        if (this.viewerType === 'Disability') {
            this.ngZone.run(async () => {
                await fetchDisabilities();
                chrome.storage.local.set({ disabilitiesUpdated: new Date().toLocaleString() });
                this.populateDisabilityTable();
            });
        } else if(this.viewerType === 'Claims') {
            this.ngZone.run(async () => {
                await fetchClaims();
                chrome.storage.local.set({ claimsUpdated: new Date().toLocaleString() });
                this.populateClaimsTable();
            });
        } else if (this.viewerType === 'Appeals') {
            this.ngZone.run(async () => {
                await fetchAppeals();
                chrome.storage.local.set({ appealsUpdated: new Date().toLocaleString() });
                this.populateAppealsTable();
            });
        } else if (this.viewerType === 'Letters') {
            this.ngZone.run(async () => {
                await fetchLetters();
                chrome.storage.local.set({ lettersUpdated: new Date().toLocaleString() });
                this.populateLettersTable();
            });
        }

        this.updateLastUpdated();
    }

    // Function to handle refresh button click
    handleClaimRefresh() {
        this.ngZone.run(() => {
            // Fetch new data
            fetchClaims();
        });
    }

    // Function to handle refresh button click
    handleDisabilityRefresh() {
        this.ngZone.run(() => {
            // Fetch new data
            fetchDisabilities();
        });
    }

    handleAppealRefresh() {
        this.ngZone.run(() => { 
            // Fetch new data
            fetchAppeals();
        });
    }

    handleLetterRefresh() {
        this.ngZone.run(() => { 
            // Fetch new data
            fetchLetters();
        });
    }

    // Add this method or update your existing clear data handler
    handleClearDataClick() {
        this.chromeService.removeFromStorage(['disabilities', 'claims', 'appeals', 'letters', 'disabilitiesUpdated', 'claimsUpdated', 'appealsUpdated', 'lettersUpdated'])
            .then(() => {
                console.log('Cleared all data');
                
                // Clear both tables
                this.showEmptyDisabilityTable();
                this.showEmptyClaimsTable();
                this.showEmptyAppealsTable();
                this.showEmptyLettersTable();
                this.combinedRating = '---';

            });
    }

    // Function to open issues in a modal or dialog for the selected appeal
    showIssues(appeal: AppealModel) {
        // Check if appeal has issues
        if (!appeal.issues || appeal.issues.length === 0) {
            alert('No issues available for this appeal.');
            return;
        }

        // Open a modal or display the issues in a dialog
        const issuesText = appeal.issues.map((issue: AppealIssue) => 
            `Description: ${issue.description}\n` +
            `Diagnostic Code: ${issue.diagnosticCode || 'N/A'}\n` +
            `Last Action: ${issue.lastAction || 'N/A'}\n` +
            `Date: ${issue.date || 'N/A'}\n`
        ).join('\n');

        alert(`Appeal Issues:\n\n${issuesText}`);
    }

//#region Disability Table Sorting

    // Sorting functionality for disability table
    private initializeSorting(): void {
        const sortableHeaders = document.querySelectorAll('#disabilityContainer .sortable');
        
        sortableHeaders.forEach(header => {
            // Remove existing event listeners to prevent duplicates
            const newHeader = header.cloneNode(true) as HTMLElement;
            header.parentNode?.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLElement;
                const sortKey = target.dataset['sort'];
                if (!sortKey) return;

                const currentDirection = this.currentSort.column === sortKey && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                
                // Remove previous sort indicators
                sortableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
                
                // Add current sort indicator
                target.classList.add(currentDirection);
                
                // Update current sort state
                this.currentSort = { column: sortKey, direction: currentDirection };
                
                // Perform the sort
                this.sortDisabilityTable(sortKey, currentDirection);
            });
        });
    }

    private sortDisabilityTable(column: string, direction: 'asc' | 'desc'): void {
        const tbody = document.getElementById('disabilityRows');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Skip if no data rows or only placeholder row
        if (rows.length <= 1 || rows[0].cells.length === 1) {
            return;
        }
        
        const sortedRows = rows.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;
            
            switch(column) {
                case 'diagnosticCode':
                    aValue = a.cells[0].textContent?.trim() || '';
                    bValue = b.cells[0].textContent?.trim() || '';
                    // Convert to numbers if possible
                    const aNum = parseInt(aValue.toString());
                    const bNum = parseInt(bValue.toString());
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return direction === 'asc' ? aNum - bNum : bNum - aNum;
                    }
                    // Add missing return for string comparison
                    return direction === 'asc' 
                        ? aValue.toString().localeCompare(bValue.toString())
                        : bValue.toString().localeCompare(aValue.toString());
                case 'status':
                    aValue = (a.cells[1].textContent?.trim() || '').toLowerCase();
                    bValue = (b.cells[1].textContent?.trim() || '').toLowerCase();
                    break;
                case 'disability':
                    aValue = (a.cells[2].textContent?.trim() || '').toLowerCase();
                    bValue = (b.cells[2].textContent?.trim() || '').toLowerCase();
                    break;
                case 'rating':
                    aValue = a.cells[3].textContent?.trim() || '';
                    bValue = b.cells[3].textContent?.trim() || '';
                    // Extract numbers from rating (e.g., "30%" -> 30)
                    const aRating = parseInt(aValue.toString().replace('%', '')) || 0;
                    const bRating = parseInt(bValue.toString().replace('%', '')) || 0;
                    return direction === 'asc' ? aRating - bRating : bRating - aRating;
                case 'isStatic':
                    aValue = (a.cells[4].textContent?.trim() || '').toLowerCase();
                    bValue = (b.cells[4].textContent?.trim() || '').toLowerCase();
                    break;
                default:
                    aValue = (a.cells[0].textContent?.trim() || '').toLowerCase();
                    bValue = (b.cells[0].textContent?.trim() || '').toLowerCase();
            }
            
            // String comparison for non-numeric columns
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (direction === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            }
            
            return 0;
        });
        
        // Clear and re-append sorted rows
        tbody.innerHTML = '';
        sortedRows.forEach(row => tbody.appendChild(row));
    }
//#endregion Disability Table Sorting

    exportDisabilitiesToCSV() {
        if (!this.disabilityRatings || this.disabilityRatings.length === 0) {
            alert('No data to export.');
            return;
        }
        const replacer = (key: string, value: any) => value === null ? '' : value;
        const header = [
            'Diagnostic Type Code',
            'hyph_diagnostic_type_code',
            'Decision',
            'Diagnostic Text',
            'Rating Percentage',
            'static'
        ];
        const csv = [
            header.join(','),
            ...this.disabilityRatings.map(row => 
                [
                    JSON.stringify(row.diagnostic_type_code, replacer),
                    JSON.stringify(row.hyph_diagnostic_type_code, replacer),
                    JSON.stringify(row.decision, replacer),
                    JSON.stringify(row.diagnostic_text, replacer),
                    JSON.stringify(row.rating_percentage, replacer),
                    JSON.stringify(row.static_ind, replacer)
                ].join(',')
            )
        ].join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'disabilities.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

}
