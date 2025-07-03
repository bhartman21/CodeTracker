import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import fetchDisabilities, { DisabilityModel, IndividualRatingModel } from '../api/fetchDisabilities';
import fetchLoginStatus, { LoginStatusModel } from '../api/fetchLoginStatus';
import fetchClaims, { ClaimModel } from '../api/fetchClaims';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {

    isLoggedIn: boolean = false;
    currentSort: any;
    viewerType: string = 'Disability';
 
    constructor() {
        // Initialize the disability table on component creation
        this.populateDisabilityTable();
        // Check login status
        this.checkLoginStatus();
    }

    private async checkLoginStatus() {
    try {
        const status = await fetchLoginStatus();
        this.isLoggedIn = status.isLoggedIn;
    } catch (error) {
        console.error('Error checking login status:', error);
        this.isLoggedIn = false;
    }
    }

    ngOnInit(): void {
        // Initial setup or data fetching can be done here
        console.log('App component initialized');
    }

    public navigateToVA(): void {
        window.open('https://www.va.gov/sign-in/', '_vaLogin');
    }

    public navigateTipJar(): void {
        window.open('https://tiptopjar.com/bhartman21', '_tipJar');
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
                // Render claims table here
                this.renderClaimsTable(claims);
                // This part is not implemented in the original code
                console.log('Claims data:', claims);
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
            combinedRatingDisplay.innerHTML = `<h2 style="text-align: center; background-color: #00ff00;">Total Combined Rating: ${disabilities.combinedRating}%</h2>`;
            combinedRatingDisplay.style.display = 'block';
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
    }

    private renderClaimsTable(claims: ClaimModel[]) {
        const claimsRows = document.getElementById('claimsRows');
        if (!claimsRows) return;
        // Clear existing rows
        claimsRows.innerHTML = '';
        // Add claims data
        claims.forEach((claim: ClaimModel) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${claim.claimId || 'N/A'}</td>
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
                <td colspan="4" class="has-text-centered">No disability data available. Click "Refresh Data" to load.</td>
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
        const viewerType = document.getElementById('viewerType');
        if (viewerType && (viewerType as HTMLSelectElement).value === 'disabilitiesList') {
            this.handleDisabilityRefreshClick();
        } else if(viewerType && (viewerType as HTMLSelectElement).value === 'claimsList') {
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
        
        // Wait a moment for the data to be stored, then populate table
        setTimeout(() => {
            this.populateDisabilityTable();
        }, 500);
    }



    // Initialize event listeners
    ngAfterViewInit() {
        // Handle viewer type selection
        const viewerType = document.getElementById('viewerType') as HTMLSelectElement;
        const claimsContainer = document.getElementById('claimsContainer');
        const disabilityContainer = document.getElementById('disabilityContainer');

        // Set initial state based on selected option
        if (viewerType?.value === 'disabilitiesList') {
            claimsContainer!.style.display = 'none';
            disabilityContainer!.style.display = 'block';
            this.populateDisabilityTable();
        } else {
            claimsContainer!.style.display = 'block';
            disabilityContainer!.style.display = 'none';
        }

        if (viewerType?.value === 'claimsList') {
            claimsContainer!.style.display = 'block';
            disabilityContainer!.style.display = 'none';
        } else {
            claimsContainer!.style.display = 'none';
            disabilityContainer!.style.display = 'block';
        }

        viewerType?.addEventListener('change', (event) => {
            this.viewerType = '';
            const target = event.target as HTMLSelectElement;
            chrome.storage.local.set({ currentViewType: target.value });
            if (target.value === 'disabilitiesList') {
                this.viewerType = 'Disability';
                claimsContainer!.style.display = 'none';
                disabilityContainer!.style.display = 'block';
                fetchDisabilities();
                setTimeout(() => this.populateDisabilityTable(), 500);
            } else if (target.value === 'claimsList') {
                this.viewerType = 'Claims';
                claimsContainer!.style.display = 'block';
                disabilityContainer!.style.display = 'none';
                fetchClaims();
                setTimeout(() => this.populateClaimsTable(), 500);
            }
        });

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
                // Check if disability container is currently visible
                const disabilityContainer = document.getElementById('disabilityContainer');
                if (disabilityContainer && disabilityContainer.style.display !== 'none') {
                    this.populateDisabilityTable();
                }
            }
        });

        // // Initially hide disability container
        // if (disabilityContainer) {
        //     disabilityContainer.style.display = 'none';
        // }

    }

    // Add this method or update your existing clear data handler
    handleClearDataClick() {
        // Clear both disabilities and claims from storage
        chrome.storage.local.remove(['disabilities', 'claims'], () => {
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
