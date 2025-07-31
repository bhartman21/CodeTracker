const LOCATION_ENDPOINT = "https://api.va.gov/v0/appeals";

export default function fetchAppeals(): Promise<void> {
    return new Promise((resolve, reject) => 
    fetch(LOCATION_ENDPOINT)
    .then(response => response.json())
    .then(data => { 
        var appealsList: AppealModel[] = [];
        data?.data?.forEach((appeal: { id: string; type: string; attributes: any; }) => {
            appealsList.push(new AppealModel({
                id: appeal.id,
                type: appeal.type,
                appealIds: appeal.attributes?.appealIds ?? [],
                updated: appeal.attributes?.updated ?? '',
                incompleteHistory: appeal.attributes?.incompleteHistory ?? false,
                active: appeal.attributes?.active ?? false,
                description: appeal.attributes?.description ?? '',
                location: appeal.attributes?.location ?? '',
                aoj: appeal.attributes?.aoj ?? '',
                programArea: appeal.attributes?.programArea ?? '',
                status: appeal.attributes?.status ? new AppealStatus(appeal.attributes.status) : new AppealStatus(),
                alerts: appeal.attributes?.alerts ?? [],
                issues: appeal.attributes?.issues ?? [],
                events: appeal.attributes?.events ?? [],
                evidence: appeal.attributes?.evidence ?? []
            }));
        });
       
        chrome.storage.local.set({ appeals: appealsList, appealsUpdated: new Date().toLocaleString() }, () => {
            resolve(); // Only resolve after storage is updated
        });
    })
    .catch(reject => {
        console.log(reject);
    })
    );

}






export class AppealModel {
  id!: string;
  type!: string;                     // "higherLevelReview" | "supplementalClaim"
  appealIds!: string[];
  updated!: string;
  incompleteHistory!: boolean;
  active!: boolean;
  description!: string;
  location!: string;                 // e.g., "aoj"
  aoj!: string;                      // e.g., "vba"
  programArea!: string;              // e.g., "compensation"
  status: AppealStatus;
  alerts: AppealAlert[];
  issues: AppealIssue[];
  events: AppealEvent[];
  evidence: any[];

  constructor(init?: Partial<AppealModel>) {
    Object.assign(this, init);
    this.status = init?.status ? new AppealStatus(init.status) : new AppealStatus();
    this.alerts = init?.alerts?.map(a => new AppealAlert(a)) ?? [];
    this.issues = init?.issues?.map(i => new AppealIssue(i)) ?? [];
    this.events = init?.events?.map(e => new AppealEvent(e)) ?? [];
    this.evidence = init?.evidence ?? [];
  }
}

export class AppealStatus {
  type!: string;                     // e.g., "hlr_decision", "sc_recieved"
  details: { issues?: AppealStatusIssue[] } | {};

  constructor(init?: Partial<AppealStatus>) {
    Object.assign(this, init);
    this.details = init?.details ?? {};
  }
}

export class AppealStatusIssue {
  description!: string;
  disposition!: string;              // "Granted" | "Denied"

  constructor(init?: Partial<AppealStatusIssue>) {
    Object.assign(this, init);
  }
}

export class AppealAlert {
  type: string;                     // e.g., "ama_post_decision"
  decisionDate?: string;
  dueDate?: string;
  cavcDueDate?: string | null;
  availableOptions?: string[];

  constructor(init?: any) {
    this.type = init?.type ?? '';
    this.decisionDate = init?.details?.decisionDate ?? null;
    this.dueDate = init?.details?.dueDate ?? null;
    this.cavcDueDate = init?.details?.cavcDueDate ?? null;
    this.availableOptions = init?.details?.availableOptions ?? [];
  }
}

export class AppealIssue {
  active!: boolean;
  lastAction!: string | null;        // e.g., "Granted", "Denied"
  date!: string | null;
  description!: string;
  diagnosticCode!: string | null;

  constructor(init?: Partial<AppealIssue>) {
    Object.assign(this, init);
  }
}

export class AppealEvent {
  type!: string;                     // e.g., "hlr_request", "dta_decision"
  date!: string;

  constructor(init?: Partial<AppealEvent>) {
    Object.assign(this, init);
  }
}
