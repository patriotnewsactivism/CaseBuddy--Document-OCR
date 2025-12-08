import { IntegrationConfig } from './types';

export const APP_NAME = "CaseBuddy Intelligent OCR";
export const APP_VERSION = "2.0.1";

export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  caseBuddyEndpoint: "https://api.casebuddy.example.com/v1/ingest",
  cloudBucketUrl: "s3://casebuddy-legal-docs-prod/incoming",
  autoSync: true,
};

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp"
];

// Using the complex text model for higher accuracy on documents
export const OCR_MODEL_NAME = "gemini-3-pro-preview"; 
