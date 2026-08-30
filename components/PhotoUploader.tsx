'use client'

import { useState } from "react"
import { getUploadUrl, uploadfileDirectToS3 } from "@/lib/api-client"

interface Props {
    onUploaded: (publicKey: string) => void;
    label?: string;
}

export function PhotoUploader({ onUploaded, label = "Upload Photo" }: Props) {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

    const handleFile = async (file: File) => {
        setStatus('uploading');
        try {
            const {uploadUrl, key} = await getUploadUrl(file.type);
            await uploadfileDirectToS3(file, uploadUrl);
            setStatus('done');
            onUploaded(key);
        } catch {
            setStatus('error');
        }
    }
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm border rounded-md px-3 py-1.5 cursor-pointer">
                {label}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
            </label>
            {status === 'uploading' && <span className="text-xs text-gray-500">Uploading…</span>}
            {status === 'done' && <span className="text-xs text-green-600">Uploaded ✓</span>}
            {status === 'error' && <span className="text-xs text-red-600">Upload failed</span>}
        </div>
    );
}