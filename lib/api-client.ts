// Every fetch call goes through here. 

import type { AssetRecord, NotificationItem, DualSearchResponse, AgentResponse, PhotoGradeResult, EmbeddingDebugResponse } from "./types";

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`GET ${path} failed: ${res.status}`);
    }
    return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`POST ${path} failed: ${res.status}`)
    };

    return res.json();
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`PATCH ${path} failed: ${res.status}`)
    }

    return res.json();
}

// ------  Assets ----
export const getAssets = (tenantId: string, groupId: string) => apiGet<AssetRecord[]>(`/api/assets?tenant=${tenantId}&group=${groupId}`);

export const createAsset = (input: { tenantId: string; groupId: string; status?: string; attributes: Record<string, string>; }) => apiPost<{ recordId: string }>(`/api/assets`, input);

export const updateAssetStatus = (recordKey: { PK: string, SK: string }, status: string) => apiPatch<{ ok: true }>('/api/assets', { ...recordKey, status });

export const updateAssetPhoto = (recordKey: { PK: string; SK: string }, photoUrl: string) =>
    apiPatch<{ ok: true }>("/api/assets", { ...recordKey, photoUrl });

// ----- Photos ----
export const getUploadUrl = (contentType: string) => apiPost<{ uploadUrl: string; key: string }>('/api/upload-url', { contentType });

export async function uploadfileDirectToS3(file: File, uploadUrl: string): Promise<void> {
    const contentType = file.type || "application/octet-stream";
    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
    });
    if (!res.ok) {
        throw new Error(`S3 upload failed: ${res.status}`);
    }
}

// ----- Notifications ----
export const getNotifications = (tenantId: string) => apiGet<NotificationItem[]>(`/api/notifications?tenant=${tenantId}`);

// ---- Search ----
export const searchAssets = (query: string, tenantId: string) => apiPost<DualSearchResponse>('/api/search', { query, tenantId });

export const debugEmbed = (text: string, opts?: { tenantId?: string; index?: boolean }) =>
    apiPost<EmbeddingDebugResponse>('/api/embed-debug', { text, ...opts });

// ---- Chat (RAG) ----
export const sendChatMessage = (question: string) => apiPost<{ answer: string }>('/api/chat', { question });

// ---- Agent ----
export const runInspectionAgent = (inspectionNode: string) => apiPost<AgentResponse>('/api/agent', { inspectionNode });

// ---- visionGrading ----
export const gradePhoto = (imageUrl: string) => apiPost<PhotoGradeResult>('/api/grade-photo', { imageUrl });