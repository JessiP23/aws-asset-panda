'use client';

import { useState } from "react";
import { CustomFieldEntry } from "@/lib/types";

interface Props {
    onSubmit: (fields: Record<string, string>) => void | Promise<void>;
    submitLabel?: string;
}

export function DynamicFieldsForm({ onSubmit, submitLabel = 'Save' }: Props) {
    const [fields, setFields] = useState<CustomFieldEntry[]>([{ key: '', value: '' }])

    const updateField = (index: number, patch: Partial<CustomFieldEntry>) => {
        setFields((prev) => prev.map((f, i) => (i === index ? {...f, ...patch}: f)))
    }

    const removeField = (index: number) => {
        setFields((prev) => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        const record: Record<string, string> = {};
        for (const f of fields) if (f.key.trim()) record[f.key.trim()] = f.value;
        await onSubmit(record);
        setFields([{ key: '', value: '' }]);
    }

    return (
    <form onSubmit={handleSubmit} className="space-y-2">
        {fields.map((field, i) => (
            <div key={i} className="flex gap-2">
                <input
                    placeholder="Field name (e.g. VIN)"
                    value={field.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                    className="border rounded-md px-2 py-1 text-sm flex-1"
                />
                <input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateField(i, { value: e.target.value })}
                    className="border rounded-md px-2 py-1 text-sm flex-1"
                />
                <button type="button" onClick={() => removeField(i)} className="text-red-500 text-sm px-2">
                    ✕
                </button>
            </div>
        ))}
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => setFields((prev) => [...prev, { key: '', value: '' }])}
                className="text-sm text-blue-600"
            >
                + Add field
            </button>
            <button type="submit" className="ml-auto bg-black text-white text-sm px-4 py-1.5 rounded-md">
                {submitLabel}
            </button>
        </div>
    </form>
  );
}