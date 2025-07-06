const LOCATION_ENDPOINT = 'https://api.va.gov/v0/rated_disabilities';

export default function fetchDisabilities() {
    // Fetch disabilities from the VA API
    fetch(LOCATION_ENDPOINT)
        .then(response => response.json())
        .then(disability => {
            // filter the data to include only the necessary fields
            var disabilitiesList = new DisabilityModel({
                combined_disability_rating: disability.data.attributes.combined_disability_rating,
                combined_effective_date: disability.data.attributes.combined_effective_date,
                legal_effective_date: disability.data.attributes.legal_effective_date,
                individual_ratings: []
            });
            disabilitiesList.individualRatings = disability.data.attributes.individual_ratings;

            chrome.storage.local.set({ disabilities: disabilitiesList, disabilitiesUpdated: new Date().toLocaleString() });
        })
        .catch(error => {
            console.log(error);
        })
}

// Model for an individual rating
export class IndividualRatingModel {
    decision: string | null;
    diagnosticText: string | null;
    diagnosticCode: string | null;
    diagnosticName: string | null;
    ratingId: string | null;
    effectiveDate: Date;
    ratingEndDate: Date;
    rating: string | null;
    isStatic: string | null;

    constructor({
        decision = '',
        diagnostic_text = null,
        diagnostic_type_code = null,
        diagnostic_type_name = null,
        disability_rating_id = null,
        effective_date = new Date(),
        rating_end_date  = new Date(),
        rating_percentage = null,
        static_ind = null
    }) {
        this.decision = decision;
        this.diagnosticText = diagnostic_text;
        this.diagnosticCode = diagnostic_type_code;
        this.diagnosticName = diagnostic_type_name;
        this.ratingId = disability_rating_id;
        this.effectiveDate = effective_date;
        this.ratingEndDate = rating_end_date;
        this.rating = rating_percentage;
        this.isStatic = static_ind;
    }
}

// Model for the top-level disability data
export class DisabilityModel {
    combinedRating: number;
    combinedEffectiveDate: string | null;
    legalEffectiveDate: string | null;
    individualRatings: any[];

    constructor({
        combined_disability_rating = 0,
        combined_effective_date = null,
        legal_effective_date = null,
        individual_ratings = []
    }) {
        this.combinedRating = combined_disability_rating;
        this.combinedEffectiveDate = combined_effective_date;
        this.legalEffectiveDate = legal_effective_date;
        this.individualRatings = [];
    }
}
