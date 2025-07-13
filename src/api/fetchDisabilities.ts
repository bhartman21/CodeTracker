const LOCATION_ENDPOINT = 'https://api.va.gov/v0/rated_disabilities';

export default function fetchDisabilities() {
    // Fetch disabilities from the VA API
    fetch(LOCATION_ENDPOINT)
        .then(response => response.json())
        .then(disability => {
            const attributes = disability?.data?.attributes;

            if (!attributes) {
                console.log('There are no attributes in disability response:', disability);
                return;
            }

            // filter the data to include only the necessary fields
            var disabilitiesList = new DisabilityModel({
                combined_disability_rating: disability.data.attributes.combined_disability_rating ?? 0,
                combined_effective_date: disability.data.attributes.combined_effective_date ?? null,
                legal_effective_date: disability.data.attributes.legal_effective_date ?? null,
                individual_ratings: []
            });
            disabilitiesList.individualRatings = disability.data.attributes.individual_ratings ?? [];

            chrome.storage.local.set({ disabilities: disabilitiesList, disabilitiesUpdated: new Date().toLocaleString() });
        })
        .catch(error => {
            console.log(error);
        })
}

// Model for an individual rating
export class IndividualRatingModel {
    decision: string | null ;
    diagnostic_text: string | null ;
    diagnostic_type_code: string | null ;
    hyph_diagnostic_type_code: string | null;
    diagnostic_type_name: string | null ;
    disability_rating_id: string | null ;
    effective_date: Date | string | null;
    rating_end_date: Date | string | null;
    rating_percentage: string | null ;
    static_ind: string | null ;

    constructor({
        decision = '',
        diagnostic_text = null,
        diagnostic_type_code = null,
        diagnostic_type_name = null,
        disability_rating_id = null,
        effective_date = new Date(),
        rating_end_date  = new Date(),
        rating_percentage = null,
        static_ind = null, 
        hyph_diagnostic_type_code = null
    }) {
        this.decision = decision;
        this.diagnostic_text = diagnostic_text;
        this.diagnostic_type_code = diagnostic_type_code;
        this.hyph_diagnostic_type_code = hyph_diagnostic_type_code;
        this.diagnostic_type_name = diagnostic_type_name;
        this.disability_rating_id = disability_rating_id;
        this.effective_date = effective_date;
        this.rating_end_date = rating_end_date;
        this.rating_percentage = rating_percentage;
        this.static_ind = static_ind;
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
