import { NextRequest, NextResponse } from "next/server";
import { ddb, TABLE } from "@/lib/dynamo";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ALLOWED_STATUSES = ["Operational", "In Maintenance", "Disposed"] as const;
const PHOTO_KEY = /^photos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
    const tenantId = req.nextUrl.searchParams.get('tenant') ?? "tenant-a";
    const groupId = req.nextUrl.searchParams.get('group') ?? 'vehicles';

    const resp = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `TENANT#${tenantId}`,
            ':sk': `GROUP#${groupId}#RECORD#`,
        },
    }));

    return NextResponse.json(resp.Items ?? []);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const recordId = randomUUID();

    await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
            PK: `TENANT#${body.tenantId}`,
            SK: `GROUP#${body.groupId}#RECORD#${recordId}`,
            status: body.status ?? "Operational",
            attributes: body.attributes ?? {},
            photoUrl: null,
        },
    }));

    return NextResponse.json({ recordId });
}

export async function PATCH(req: NextRequest) {
    if (!TABLE) {
        return NextResponse.json({ error: "TABLE_NAME is not set" }, { status: 500 });
    }

    const body = await req.json();
    const { PK, SK, status, photoUrl } = body as {
        PK?: string;
        SK?: string;
        status?: string;
        photoUrl?: string;
    };

    if (!PK || !SK) {
        return NextResponse.json({ error: "PK and SK are required" }, { status: 400 });
    }
    if (status === undefined && photoUrl === undefined) {
        return NextResponse.json({ error: "status or photoUrl is required" }, { status: 400 });
    }
    if (status !== undefined && !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (photoUrl !== undefined && !PHOTO_KEY.test(photoUrl)) {
        return NextResponse.json({ error: "Invalid photoUrl" }, { status: 400 });
    }

    const names: Record<string, string> = {};
    const values: Record<string, string> = {};
    const sets: string[] = [];

    if (status !== undefined) {
        names["#status"] = "status";
        values[":status"] = status;
        sets.push("#status = :status");
    }
    if (photoUrl !== undefined) {
        names["#photoUrl"] = "photoUrl";
        values[":photoUrl"] = photoUrl;
        sets.push("#photoUrl = :photoUrl");
    }

    try {
        await ddb.send(new UpdateCommand({
            TableName: TABLE,
            Key: { PK, SK },
            UpdateExpression: `SET ${sets.join(", ")}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
        }));
    } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "ConditionalCheckFailedException") {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        throw err;
    }

    return NextResponse.json({ ok: true });
}