export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum SourceType {
  LOCAL = 'LOCAL',
  FOLDER = 'FOLDER',
  CLOUD = 'CLOUD',
}

export interface ExtractedData {
  rawText: string;
  summary: string;
  entities: {
    dates: string[];
    names: string[];
    caseNumbers: string[];
  };
  confidenceScore: number;
}

export interface DocumentAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
  status: ProcessingStatus;
  source: SourceType;
  extractedData?: ExtractedData;
  uploadDate: Date;
  errorMessage?: string;
}

export interface IntegrationConfig {
  caseBuddyEndpoint: string;
  cloudBucketUrl: string;
  autoSync: boolean;
}