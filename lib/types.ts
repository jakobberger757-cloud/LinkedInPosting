export type SourceRecord = {
  id: string;
  title: string;
  url?: string | null;
  rawInput: string;
  sourceText: string;
  summary: string;
  sourceType: "notes" | "url" | "mixed";
  createdAt: string;
};

export type AngleRecord = {
  id: string;
  sourceId: string;
  text: string;
  audienceLens: string;
  suggestedFormat: string;
  confidence: number;
  createdAt: string;
};

export type DraftEvaluation = {
  pass: boolean;
  hardFails: string[];
  advisories: string[];
  repetitionWarning: boolean;
  scores: {
    stopScroll: number;
    pointOfView: number;
    voice: number;
    specificity: number;
    discipline: number;
  };
};

export type DraftRecord = {
  id: string;
  angleId: string;
  label: string;
  text: string;
  evaluation: DraftEvaluation;
  createdAt: string;
};

export type FeedbackRecord = {
  id: string;
  draftId: string;
  vote: "up" | "down";
  createdAt: string;
};

export type HistoryItem = {
  source: SourceRecord;
  angles: Array<AngleRecord & { drafts: DraftRecord[] }>;
};

export type FullGenerationResponse = {
  source: SourceRecord;
  angles: AngleRecord[];
  selectedAngleId: string;
  drafts: DraftRecord[];
};
