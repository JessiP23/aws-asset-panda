export interface AssetRecord {
    PK: string;
    SK: string;
    status: string;
    attributes?: Record<string, string>;
    photoUrl?: string | null;
}

export interface CustomFieldEntry {
    key: string;
    value: string;
}

export interface NotificationItem {
    SK: string;
    message: string;
    createdAt: string;
}

export interface SearchHit {
    id: string;
    text: string;
    score: number;
}

export interface SearchEngineResult {
    hits: SearchHit[];
    ms: number;
    error?: string;
}

export interface DualSearchResponse {
    opensearch: SearchEngineResult;
    weaviate: SearchEngineResult;
}

export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface ToolCallLogEntry {
    role: string;
    content?: string | null;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
}

export interface AgentResponse {
    finalAnswer: string;
    toolCallLog: ToolCallLogEntry[];
}

export interface PhotoGradeResult {
    conditionGrade: "Good" | "Fair" | "Damaged";
    checklist: {
        scratches: boolean;
        dents: boolean;
        functional: boolean;
    }
    confidence: "high" | "medium" | "low";
    notes: string;
}

export interface Tenant {
    id: string;
    label: string;
}