'use client';

import { useState } from 'react';
import { PhotoUploader } from '@/components/PhotoUploader';
import { ToolCallLog } from '@/components/ToolCalling';
import { ConditionBadge } from '@/components/ConditionBadge';
import { runInspectionAgent, gradePhoto } from '@/lib/api-client';
import type { AgentResponse, PhotoGradeResult } from '@/lib/types';

export default function InspectPage() {
    const [note, setNote] = useState('');
    const [agentResult, setAgentResult] = useState<AgentResponse | null>(null);
    const [gradeResult, setGradeResult] = useState<PhotoGradeResult | null>(null);
    const [running, setRunning] = useState(false);

    const handleRunAgent = async () => {
        if (!note.trim()) return;
        setRunning(true);
        try {
            setAgentResult(await runInspectionAgent(note));
        } finally {
            setRunning(false);
        }
    };

    const handlePhotoUploaded = async (key: string) => {
        // TODO: build the actual public/CDN URL for `key` once you decide how photos
        // are served (public S3 URL, CloudFront, or a signed GET) — this passes the
        // raw key straight through for now.
        setGradeResult(await gradePhoto(key));
    };

    return (
        <main className="max-w-2xl mx-auto p-8 space-y-10">
            <h1 className="text-xl font-semibold">Inspect</h1>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold">Inspection note → agent</h2>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Brake pads look worn, replace soon."
                    className="border rounded-md px-3 py-2 text-sm w-full h-24"
                />
                <button onClick={handleRunAgent} disabled={running} className="bg-black text-white text-sm px-4 py-1.5 rounded-md">
                    {running ? 'Running…' : 'Run agent'}
                </button>
                {agentResult && (
                    <div className="space-y-2">
                        <p className="text-sm">{agentResult.finalAnswer}</p>
                        <ToolCallLog entries={agentResult.toolCallLog} />
                    </div>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold">Photo → condition grade</h2>
                <PhotoUploader onUploaded={handlePhotoUploaded} label="Upload inspection photo" />
                {gradeResult && <ConditionBadge result={gradeResult} />}
            </section>
        </main>
    );
}