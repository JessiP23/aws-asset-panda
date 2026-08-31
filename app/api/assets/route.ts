import { NextRequest, NextResponse } from "next/server";
import { ddb, TABLE } from "@/lib/dynamo";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ALLOWED_STATUSES = ["Operational", "In Maintenance", "Disposed"] as const;

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
        return NextResponse.json({ error: "TABLE_NAME is not set" }, {status: 400})
    };

    const body = await req.json();
    const { PK, SK, status } = body as { PK?: string; SK?: string; status: string };

    if (!PK || !SK || !status) {
        return NextResponse.json({ error: "PK, SK, and status are required" }, { status: 400 });
    };

    if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    try {
        await ddb.send(new UpdateCommand({
            TableName: TABLE,
            Key: { PK, SK },
            UpdateExpression: "SET #status = :status",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":status": status },
            ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
        }))
    } catch(err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "ConditionalCheckFailedException") {
            return NextResponse.json({ error: "Asset not found" }, { status: 400 });
        }
        throw err
    }

    return NextResponse.json({ ok: true });
}