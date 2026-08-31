import { NextRequest, NextResponse } from "next/server";
import { ddb, TABLE } from "@/lib/dynamo";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(req: NextRequest) {
    const tenantId = req.nextUrl.searchParams.get("tenant") ?? "tenant-a";
    const resp = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `TENANT#${tenantId}`, ':sk': "NOTIFICATION#" },
        ScanIndexForward: false,
        Limit: 50,
    }));

    return NextResponse.json(resp.Items ?? []);
}