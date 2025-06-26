import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import fetchDisabilities, { DisabilityModel, IndividualRatingModel } from '../api/fetchDisabilities';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // protected title = 'va-disability-extension';
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
    }

    // Function to show empty state
    private showEmptyDisabilityTable() {
        const disabilityRows = document.getElementById('disabilityRows');
        if (!disabilityRows) return;

        disabilityRows.innerHTML = `
            <tr>
                <td colspan="4" class="has-text-centered">No disability data available. Click "Refresh Data" to load.</td>
            </tr>
        `;
    }

    // Function to handle refresh button click
    handleRefreshClick() {
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
        }, 2000);
    }

    // Initialize event listeners
    ngAfterViewInit() {
        // Handle viewer type selection
        const viewerType = document.getElementById('viewerType') as HTMLSelectElement;
        const claimsContainer = document.getElementById('claimsContainer');
        const disabilityContainer = document.getElementById('disabilityContainer');

        viewerType?.addEventListener('change', (event) => {
            const target = event.target as HTMLSelectElement;
            if (target.value === 'disabilitiesList') {
                claimsContainer!.style.display = 'none';
                disabilityContainer!.style.display = 'block';
                this.populateDisabilityTable();
            } else {
                claimsContainer!.style.display = 'block';
                disabilityContainer!.style.display = 'none';
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
            chrome.storage.local.clear();
            this.showEmptyDisabilityTable();
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

        // Initially hide disability container
        if (disabilityContainer) {
            disabilityContainer.style.display = 'none';
        }

      }

}

