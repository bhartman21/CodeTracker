const LOCATION_ENDPOINT = "https://api.va.gov/v0/benefits_claims";

export default function fetchClaims() {
    fetch(LOCATION_ENDPOINT)
        .then(response => response.json())
        .then(data => { 
            var claimsList: ClaimModel[] = [];
            data?.data?.forEach((claim: { id: string; type: string; attributes: any; }) => {
                claimsList.push(new ClaimModel({
                    claimId: claim.id,
                    claimType: claim.attributes.claimType,
                    claimTypeCode: claim.attributes.claimTypeCode,
                    closeDate: claim.attributes.closeDate,
                    status: claim.attributes.status
                }));
            });
           
            chrome.storage.local.set({ claims: claimsList, claimsUpdated: new Date().toLocaleString() });
        })
        .catch(error => {
            console.log(error);
        })
}

// Model for disability claims
export class ClaimModel {
  claimId: string;
  claimType: string;
  claimTypeCode: string;
  closeDate: string | null;
  status: string;

    constructor({
        claimId = '',
        claimType = '',
        claimTypeCode = '',
        closeDate = null,
        status = ''
    }) {
        this.claimId = claimId;
        this.claimType = claimType;
        this.claimTypeCode = claimTypeCode;
        this.closeDate = closeDate;
        this.status = status;
    }


    /* 
    attributes: 
        baseEndProductCode: "510"
    x    claimDate: "2025-02-24"
        claimPhaseDates: 
            phaseChangeDate: "2025-03-13"
            phaseType: "COMPLETE"
    x    claimType: "Freedom of Information Act / Privacy Act Request"
    x    claimTypeCode: "510PAR"
        closeDate: "2025-03-13"
        decisionLetterSent: true
        developmentLetterSent: true
        documentsNeeded: false
        endProductCode: "518"
        evidenceWaiverSubmitted5103: false
        lighthouseId: null
        status: "COMPLETE"    
    */
}