export interface MeetingAnalysis {
  summary: string;
  speakers: Speaker[];
  redFlags: RedFlag[];
  promises: MeetingPromise[];
  businessDirection: string;
  investmentImplications: string;
}

export interface Speaker {
  name: string;
  role: string;
  sentiment: "optimistic" | "cautious" | "defensive" | "evasive";
  keyQuotes: string[];
  analysis: string;
}

export interface RedFlag {
  flag: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  timestamp?: string;
}

export interface MeetingPromise {
  content: string;
  timeline: string;
  credibility: "high" | "medium" | "low";
}

export interface UploadSource {
  type: "file" | "youtube";
  url?: string;
  file?: File;
}
