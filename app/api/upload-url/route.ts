import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
        return NextResponse.json({ error: "S3_BUCKET_NAME is not set" }, { status: 500 });
    }

    const { contentType } = await req.json() as { contentType?: string };
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
        return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    const key = `photos/${randomUUID()}`;
    const url = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    }), { expiresIn: 300 });

    return NextResponse.json({ uploadUrl: url, key });
}