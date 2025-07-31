const LOCATION_ENDPOINT = "https://api.va.gov/v0/claim_letters";

export default function fetchLetters(): Promise<void> {
    return new Promise((resolve, reject) => 
        fetch(LOCATION_ENDPOINT)
        .then(response => response.json())
        .then(data => { 
            var lettersList: ClaimLetterModel[] = [];
            data?.forEach((letter: ClaimLetterModel) => {
                lettersList.push(new ClaimLetterModel({
                    document_id: letter.document_id,
                    series_id: letter.series_id ?? '',
                    version: letter.version ?? '',
                    type_description: letter.type_description ?? '',
                    type_id: letter.type_id ?? '',
                    doc_type: letter.doc_type ?? '',
                    subject: letter.subject ?? '',
                    received_at: letter.received_at ?? '',
                    source: letter.source ?? '',
                    mime_type: letter.mime_type ?? '',
                    alt_doc_types: letter.alt_doc_types ?? null,
                    restricted: letter.restricted ?? false,
                    upload_date: letter.upload_date ?? ''
                }));
            });
           
            chrome.storage.local.set({ letters: lettersList, lettersUpdated: new Date().toLocaleString() }, () => {
                resolve(); // Only resolve after storage is updated
            });
        })
        .catch(reject => {
            console.log(reject);
        })
    );
}

export class ClaimLetterModel {
  document_id!: string;
  series_id!: string;
  version!: string;
  type_description!: string;
  type_id!: string;
  doc_type!: string;
  subject!: string | null;
  received_at!: string;         // e.g., "2025-07-16"
  source!: string;             // e.g., "VBMS", "SMS"
  mime_type!: string;           // usually "application/pdf"
  alt_doc_types!: string[] | null;
  restricted!: boolean;
  upload_date!: string;         // e.g., "2025-07-16"

  constructor(init?: Partial<ClaimLetterModel>) {
    Object.assign(this, init);
  }
}
