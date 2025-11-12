import { AfterViewInit, Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
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
export class App implements OnInit, AfterViewInit, OnDestroy {

    isLoggedIn: boolean = false;
    currentSort: any = { column: '', direction: 'asc' };
    viewerType: string = 'Disability';
    lastUpdated: string = '';
    
    // Add data persistence setting
    persistDataOnClose: boolean = true;
      // Add loading state for auto-refresh
    isRefreshingData: boolean = false;
    
    combinedRating: string = '---';
    disabilityRatings: IndividualRatingModel[] = [];
    claims: ClaimModel[] = [];   
    appeals: AppealModel[] = [];
    letters: ClaimLetterModel[] = [];

    // Add cleanup tracking
    private loginCheckInterval?: number;
    private initializationTimeout?: number;

    @ViewChild('issuesModal') issuesModal!: ElementRef;constructor(
        private cdr: ChangeDetectorRef,
        private chromeService: ChromeService, 
        private ngZone: NgZone
    ) {
        // Don't call checkLoginStatus here - it will be called in ngOnInit
    }    private async checkLoginStatus() {
        try {
            // Always fetch the login status directly, do not use chrome.storage
            const status = await fetchLoginStatus();
            const previousLoginStatus = this.isLoggedIn;
            this.isLoggedIn = status.isLoggedIn;
              // Force change detection if login status changed
            if (previousLoginStatus !== this.isLoggedIn) {
                console.log('Login status changed from', previousLoginStatus, 'to', this.isLoggedIn);
                
                // Use NgZone to ensure change detection runs
                this.ngZone.run(() => {
                    this.cdr.detectChanges();
                });
            }
            
        } catch (error) {
            console.log('Error checking login status:', error);
            const previousLoginStatus = this.isLoggedIn;
            this.isLoggedIn = false;
            
            // Force change detection if status changed
            if (previousLoginStatus !== this.isLoggedIn) {
                this.ngZone.run(() => {
                    this.cdr.detectChanges();
                });
            }
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
    }    async ngOnInit(): Promise<void> {
        // First, check login status
        await this.checkLoginStatus();
        
        const result = await this.chromeService.getFromStorage(['currentViewType', 'persistDataOnClose']);
        if (result['currentViewType']) {
            this.viewerType = result['currentViewType'];
        }
        
        // Load data persistence setting
        this.persistDataOnClose = result['persistDataOnClose'] !== false; // Default to true
          // Check if data should be cleared (user logged out + persistence disabled)
        if (!this.isLoggedIn && !this.persistDataOnClose) {
            console.log('User logged out with persistence disabled - clearing data');
            await this.clearAllStoredData();
        }
        
        // Load initial data from cache (fresh data will be loaded in ngAfterViewInit)this.populateTableFromCache(this.viewerType);
        
        // Final change detection
        this.cdr.detectChanges();
        
        // Store interval ID for cleanup
        this.loginCheckInterval = window.setInterval(() => {
            this.checkLoginStatus();
        }, 60000);
    }    ngAfterViewInit() {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        this.initializationTimeout = window.setTimeout(async () => {
            try {
                // Ensure login status is checked before deciding what to do
                await this.checkLoginStatus();
                
                // Auto-refresh data on initial load if logged in, otherwise load from cache
                if (this.isLoggedIn) {
                    console.log('User is logged in - refreshing data for current tab');
                    this.refreshDataForCurrentTab();
                } else {
                    console.log('User is not logged in - loading from cache');
                    this.populateTableFromCache(this.viewerType);
                }
            } catch (error) {
                console.error('Error during initialization:', error);
                // Fallback to loading from cache
                this.populateTableFromCache(this.viewerType);
            }
        }, 100);
        
        // Make debug method available globally for testing
        (window as any).appComponent = this;
    }

    ngOnDestroy() {
        // Clean up intervals and timeouts
        if (this.loginCheckInterval) {
            clearInterval(this.loginCheckInterval);
            this.loginCheckInterval = undefined;
        }
        
        if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout);
            this.initializationTimeout = undefined;
        }
        
        // Clean up global reference
        if ((window as any).appComponent === this) {
            delete (window as any).appComponent;
        }
        
        console.log('App component destroyed - cleanup completed');
    }

    public navigateToVA(): void {
        window.open('https://www.va.gov/', 'VALogin');
    }

    public navigateTipJar(): void {
        window.open('https://www.buymeacoffee.com/bhartman21', '_blank');
    }

    public async switchViewer(type: string): Promise<void> {
        this.viewerType = type;
        chrome.storage.local.set({ currentViewType: type });

        // Check login status and then refresh data accordingly
        await this.checkLoginStatus();
        
        console.log('Switch viewer - Login status:', this.isLoggedIn, 'Type:', type);
        
        // Auto-refresh data when switching tabs if logged in
        if (this.isLoggedIn) {
            console.log('User is logged in, refreshing data...');
            this.refreshDataForCurrentTab();
        } else {
            console.log('User is not logged in, loading from cache...');
            // Just populate from cache if not logged in
            this.populateTableFromCache(type);
        }        this.cdr.detectChanges();
    }

    // Helper method to populate table from cache only
    private populateTableFromCache(type: string): void {
        console.log('Populating table from cache for type:', type);
        
        if (type === 'Disability') {
            this.populateDisabilityTable();
        } else if (type === 'Claims') {
            this.populateClaimsTable();
        } else if (type === 'Appeals') {
            this.populateAppealsTable();
        } else if (type === 'Letters') {
            this.populateLettersTable();
        }
    }

    // Method to refresh data for current tab
    private refreshDataForCurrentTab(): void {
        console.log('Refreshing data for current tab:', this.viewerType);
        this.isRefreshingData = true;
        this.cdr.detectChanges(); // Force UI update to show loading indicator

        if (this.viewerType === 'Disability') {
            this.fetchAndPopulateDisabilityTable();
        } else if (this.viewerType === 'Claims') {
            this.fetchAndPopulateClaimsTable();
        } else if (this.viewerType === 'Appeals') {
            this.fetchAndPopulateAppealsTable();
        } else if (this.viewerType === 'Letters') {
            this.fetchAndPopulateLettersTable();
        }
    }

    // Fetch methods with loading state management
    private async fetchAndPopulateDisabilityTable(): Promise<void> {
        try {
            await fetchDisabilities();
            chrome.storage.local.set({ disabilitiesUpdated: new Date().toLocaleString() });
            this.populateDisabilityTable();
        } catch (error) {
            console.error('Error fetching disabilities:', error);
        } finally {
            this.isRefreshingData = false;
            this.cdr.detectChanges();
        }
    }

    private async fetchAndPopulateClaimsTable(): Promise<void> {
        try {
            await fetchClaims();
            chrome.storage.local.set({ claimsUpdated: new Date().toLocaleString() });
            this.populateClaimsTable();
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            this.isRefreshingData = false;
            this.cdr.detectChanges();
        }
    }

    private async fetchAndPopulateAppealsTable(): Promise<void> {
        try {
            await fetchAppeals();
            chrome.storage.local.set({ appealsUpdated: new Date().toLocaleString() });
            this.populateAppealsTable();
        } catch (error) {
            console.error('Error fetching appeals:', error);
        } finally {
            this.isRefreshingData = false;
            this.cdr.detectChanges();
        }
    }

    private async fetchAndPopulateLettersTable(): Promise<void> {
        try {
            await fetchLetters();
            chrome.storage.local.set({ lettersUpdated: new Date().toLocaleString() });
            this.populateLettersTable();
        } catch (error) {
            console.error('Error fetching letters:', error);
        } finally {
            this.isRefreshingData = false;
            this.cdr.detectChanges();
        }
    }

    // Method to clear all stored data
    private async clearAllStoredData(): Promise<void> {
        return new Promise<void>((resolve) => {
            const keysToRemove = [
                'disabilityRatings', 'disabilitiesUpdated', 'combinedRating',
                'claims', 'claimsUpdated', 
                'appeals', 'appealsUpdated',
                'letters', 'lettersUpdated'
            ];
            
            chrome.storage.local.remove(keysToRemove, () => {
                console.log('Cleared all VA data from storage');
                resolve();
            });
        });
    }

    // Data persistence methods
    toggleDataPersistence(): void {
        this.persistDataOnClose = !this.persistDataOnClose;
        chrome.storage.local.set({ persistDataOnClose: this.persistDataOnClose });        console.log('Data persistence toggled:', this.persistDataOnClose);
    }

    populateDisabilityTable() {
        // Reset sort state when loading new data
        this.resetSortState();
        
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
    }    populateClaimsTable() {
        // Reset sort state when loading new data
        this.resetSortState();
        
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
    }    populateAppealsTable() {
        // Reset sort state when loading new data
        this.resetSortState();
        
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
    }    populateLettersTable() {
        // Reset sort state when loading new data
        this.resetSortState();
        
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
            });        });
        console.log('Letters populated:', this.letters);
    }

    // New method for handling refresh button click
    handleRefreshClick(): void {
        console.log('Refresh button clicked');
        
        // Check if user is logged in before allowing refresh
        if (!this.isLoggedIn) {
            console.log('Cannot refresh: User is not logged in');
            // Could add a toast notification here in the future
            return;
        }
        
        // Prevent multiple simultaneous refresh operations
        if (this.isRefreshingData) {
            console.log('Refresh already in progress, ignoring click');
            return;
        }
        
        try {
            this.refreshDataForCurrentTab();
        } catch (error) {
            console.error('Error during refresh operation:', error);
            this.isRefreshingData = false; // Reset loading state on error
        }
    }

    // Enhanced clear data method
    async handleClearDataClick(): Promise<void> {
        console.log('Clear data button clicked');
        await this.clearAllStoredData();
        
        // Clear all displayed data
        this.disabilityRatings = [];
        this.claims = [];
        this.appeals = [];
        this.letters = [];
        this.combinedRating = '---';
        this.lastUpdated = '';
        
        this.cdr.detectChanges();
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

//#region Disability Table Sorting    // Modern Angular-based sorting functionality for disability table
    sortTable(column: string): void {
        // Toggle sort direction if clicking on the same column
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        // Sort the disability ratings array
        this.disabilityRatings.sort((a, b) => {
            switch(column) {
                case 'diagnosticCode':
                    const aCode = a.diagnostic_type_code || '';
                    const bCode = b.diagnostic_type_code || '';
                    // Convert to numbers if possible
                    const aNum = parseInt(aCode.toString());
                    const bNum = parseInt(bCode.toString());
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return this.currentSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
                    }
                    // String comparison fallback
                    return this.currentSort.direction === 'asc' 
                        ? aCode.toString().localeCompare(bCode.toString())
                        : bCode.toString().localeCompare(aCode.toString());
                        
                case 'status':
                    const aStatus = (a.decision || '').toLowerCase();
                    const bStatus = (b.decision || '').toLowerCase();
                    return this.currentSort.direction === 'asc' 
                        ? aStatus.localeCompare(bStatus)
                        : bStatus.localeCompare(aStatus);
                    
                case 'condition':
                    const aCondition = (a.diagnostic_text || '').toLowerCase();
                    const bCondition = (b.diagnostic_text || '').toLowerCase();
                    return this.currentSort.direction === 'asc' 
                        ? aCondition.localeCompare(bCondition)
                        : bCondition.localeCompare(aCondition);                      case 'rating':
                    const aRating = parseInt(a.rating_percentage || '0') || 0;
                    const bRating = parseInt(b.rating_percentage || '0') || 0;
                    return this.currentSort.direction === 'asc' ? aRating - bRating : bRating - aRating;
                    
                default:
                    const aDefault = (a.diagnostic_type_code || '').toLowerCase();
                    const bDefault = (b.diagnostic_type_code || '').toLowerCase();
                    return this.currentSort.direction === 'asc' 
                        ? aDefault.localeCompare(bDefault)
                        : bDefault.localeCompare(aDefault);
            }
        });

        // Trigger change detection to update the view
        this.cdr.detectChanges();
    }

    // Reset sort state to default (unsorted)
    resetSortState(): void {
        this.currentSort = { column: '', direction: 'asc' };
        this.cdr.detectChanges();
    }

    // Legacy DOM-based sorting - keeping for reference but not used
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
                    bValue = a.cells[3].textContent?.trim() || '';
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
