export interface AnalysisResult {
    score: number;
    explanation: string;
    missingSkills: string[];
    presentSkills: string[];
    tailoredResume: string;
}
