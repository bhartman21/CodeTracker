import { AfterViewInit, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import fetchDisabilities, { DisabilityModel, IndividualRatingModel } from '../api/fetchDisabilities';
import fetchLoginStatus, { LoginStatusModel } from '../api/fetchLoginStatus';
import fetchClaims, { ClaimModel } from '../api/fetchClaims';

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
    
    constructor(private cdr: ChangeDetectorRef) {
        // Check if chrome APIs are available
        if (typeof chrome !== 'undefined' && chrome.storage) {
            // this.populateDisabilityTable();
            // Check login status
            this.checkLoginStatus();
        }
    }

    private async checkLoginStatus() {
        try {
            var makeAPIRequest = true;
            chrome.storage.local.get(['loginStatus'], (result) => {
                if (result['loginStatus']) {
                    this.isLoggedIn = result['loginStatus'].isLoggedIn;
                    makeAPIRequest = false;
                }
            });

            if (makeAPIRequest) {
                const status = await fetchLoginStatus();
                this.isLoggedIn = status.isLoggedIn;
                this.cdr.detectChanges();
            }
            console.log('Login status updated:', this.isLoggedIn);
        } catch (error) {
            console.log('Error checking login status:', error);
            this.isLoggedIn = false;
            this.cdr.detectChanges();
        }
    }

    ngOnInit(): void {
        // Check if chrome APIs are available
        if (typeof chrome === 'undefined' || !chrome.storage) {
            console.error('Chrome extension APIs not available');
            return;
        }

        // Check what viewer type was last used and load appropriate data
        chrome.storage.local.get(['currentViewType'], (result) => {
            if (result['currentViewType']) {
                this.viewerType = result['currentViewType'];
            }
        
            // Load data based on current viewer type
            if (this.viewerType === 'Disability') {
                this.populateDisabilityTable();
            } else if (this.viewerType === 'Claims') {
                this.populateClaimsTable();
            }
        
            this.cdr.detectChanges();
        });
        
        setInterval(() => {
            this.checkLoginStatus();
        }, 60000); // Check login status every 60 seconds
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
        }
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
            // this.handleDisabilityRefreshClick();
            this.populateDisabilityTable();
        } else if (type === 'Claims') {
            // this.handleClaimRefreshClick();
            this.populateClaimsTable();
        }

        this.cdr.detectChanges();
        // this.updateLastUpdated();
    }

    // Function to populate the disability table
    populateDisabilityTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['disabilities'], (result) => {
            if (result['disabilities']) {
                const disabilities: DisabilityModel = result['disabilities'];
                this.renderDisabilityTable(disabilities);
            } else {
                // If no data, show empty state
                this.showEmptyDisabilityTable();
            }
        });
    }

    populateClaimsTable() {
        // Get data from Chrome storage
        chrome.storage.local.get(['claims'], (result) => {
            if (result['claims']) {
                const claims: ClaimModel[] = result['claims'];
                this.renderClaimsTable(claims);
            } else {
                // If no data, show empty state
                console.log('No claims data available.');
            }
        });
    }                

    // Function to render the disability table with data
    private renderDisabilityTable(disabilities: DisabilityModel) {
        const disabilityRows = document.getElementById('disabilityRows');
        const combinedRatingDisplay = document.getElementById('combinedRatingDisplay');

        if (!disabilityRows) return;

        // Clear existing rows
        disabilityRows.innerHTML = '';

        // Display combined rating above table
        if (combinedRatingDisplay) {
            combinedRatingDisplay.innerHTML = `Total Combined Rating: ${disabilities.combinedRating}%`;
        }

        // Add individual ratings
        disabilities.individualRatings.forEach((rating: any) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                  ${rating.diagnostic_type_code || ''}
                  ${rating.hyph_diagnostic_type_code ? ` [${rating.hyph_diagnostic_type_code}]` : ''}
                </td>
                <td>${rating.decision || 'N/A'}</td>
                <td>${rating.diagnostic_text || 'N/A'}</td>
                <td>${rating.rating_percentage || '0'}%</td>
                <td>${rating.static_ind ? 'Yes' : 'No'}</td>
            `;
            disabilityRows.appendChild(row);
        });

        this.initializeSorting();

        // If no individual ratings, show empty state
        if (disabilities.individualRatings.length === 0) {
            disabilityRows.innerHTML = `
                <tr>
                    <td colspan="5" class="has-text-centered">No disability data available. Click "Refresh Data" to load.</td>
                </tr>
            `;
        }
    }

    // Function to render the claims table with data
    private renderClaimsTable(claims: ClaimModel[]) {
        const claimsRows = document.getElementById('claimsRows');

        if (!claimsRows) return;

        // Clear existing rows
        claimsRows.innerHTML = '';

        // Add claims data
        claims.forEach((claim: ClaimModel) => {
            const row = document.createElement('tr');
            let claimIdContent = 'N/A';
            if (claim.claimId) {
                claimIdContent = `<a class="text-red-800" href="https://api.va.gov/v0/benefits_claims/${claim.claimId}" target="_blank">${claim.claimId}</a>`;
            }

            row.innerHTML = `
                <td>${claimIdContent}</td>
                <td>${claim.claimType || 'N/A'}</td>
                <td>${claim.claimTypeCode}</td>
                <td>${claim.status}</td>
                <td>${claim.closeDate || 'N/A'}</td>
            `;
            claimsRows.appendChild(row);
        });

        // If no claims data, show empty state
        if (claims.length === 0) {
            claimsRows.innerHTML = `
                <tr>
                    <td colspan="5" class="has-text-centered">No claims data available. Click "Refresh Data" to load.</td>
                </tr>
            `;
        }
    }

    private showEmptyDisabilityTable() {
        const disabilityRows = document.getElementById('disabilityRows');
        if (!disabilityRows) return;

        disabilityRows.innerHTML = `
            <tr>
                <td colspan="5" class="has-text-centered">No disability data available. Click "Refresh Data" to load.</td>
            </tr>
        `;
    }

    private showEmptyClaimsTable() {
        const claimsRows = document.getElementById('claimsRows');
        if (!claimsRows) return;
        claimsRows.innerHTML = `
            <tr>
                <td colspan="5" class="has-text-centered">No claims data available. Click "Refresh Data" to load.</td>
            </tr>
        `;
    }

    handleRefreshClick() {
        if (this.viewerType === 'Disability') {
            this.handleDisabilityRefreshClick();
        } else if(this.viewerType === 'Claims') {
            this.handleClaimRefreshClick();
        }
    }

    // Function to handle refresh button click
    handleClaimRefreshClick() {
        // Show loading state
        const claimsRows = document.getElementById('claimsRows');
        if (claimsRows) {
            claimsRows.innerHTML = `
                <tr>
                    <td colspan="5" class="has-text-centered">Loading claims...</td>
                </tr>
            `;
        }

        // Fetch new data
        fetchClaims();
        this.updateLastUpdated();

        // Wait a moment for the data to be stored, then populate table
        setTimeout(() => {
            this.populateClaimsTable();
        }, 500);
    }

    // Function to handle refresh button click
    handleDisabilityRefreshClick() {
        // Show loading state
        const disabilityRows = document.getElementById('disabilityRows');
        if (disabilityRows) {
            disabilityRows.innerHTML = `
                <tr>
                    <td colspan="4" class="has-text-centered">Loading disabilities...</td>
                </tr>
            `;
        }

        // Fetch new data
        fetchDisabilities();
        this.updateLastUpdated();

        // Wait a moment for the data to be stored, then populate table
        setTimeout(() => {
            this.populateDisabilityTable();
        }, 500);
    }


    // Initialize event listeners
    ngAfterViewInit() {
        // Handle refresh button
        const refreshButton = document.getElementById('refreshButton');
        refreshButton?.addEventListener('click', () => {
            this.handleRefreshClick();
        });


        // Handle clear data button
        const clearButton = document.getElementById('clearDataButton');
        clearButton?.addEventListener('click', () => {
            this.handleClearDataClick();
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes['disabilities']) {
                const disabilityContainer = document.getElementById('disabilityContainer');
                if (this.viewerType === 'Disability') {
                    this.populateDisabilityTable();
                }
            }
            if (areaName === 'local' && changes['claims']) {
                if (this.viewerType === 'Claims') {
                    this.populateClaimsTable();
                }
            }
        });
    }

    // Add this method or update your existing clear data handler
    handleClearDataClick() {
        // Clear both disabilities and claims from storage
        chrome.storage.local.remove(['disabilities', 'claims', 'disabilitiesUpdated', 'claimsUpdated'], () => {
            console.log('Cleared all data');
            
            // Clear both tables
            this.showEmptyDisabilityTable();
            this.showEmptyClaimsTable();
            
            // Hide combined rating display if visible
            const combinedRatingDisplay = document.getElementById('combinedRatingDisplay');
            if (combinedRatingDisplay) {
                combinedRatingDisplay.style.display = 'none';
            }
        });
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
                    break;
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

/* this ends the table sorting javascript*/
}
