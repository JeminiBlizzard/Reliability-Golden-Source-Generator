export interface GenerationRequest {
  term: string;
  draftDefinition: string;
}

export interface GenerationResponse {
  content: string;
  error?: string;
}

export enum GeneratorStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  term: string;
  timestamp: number;
  content: string;
  downloaded?: boolean;
}