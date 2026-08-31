import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

type AssetStatusChangeDetail = {
    recordKey: { 
        PK: { 
            S: string 
        }; 
        SK: 
        { 
            S: string 
        } 
    };
    oldStatus: string;
    newStatus: string;
    assetSK?: string;
    attributes: unknown;
    photoUrl?: string | null;
}

type EventBridgeEvent = {
    id: string;
    source: string;
    "detail-type": string;
    time: string;
    detail: AssetStatusChangeDetail;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: EventBridgeEvent) => {
    const tableName = process.env.TABLE_NAME;
    if (!tableName){
        throw new Error("TABLE_NAME is not set")
    }

    const { recordKey, oldStatus, newStatus, assetSK, attributes, photoUrl } = event.detail;
    const pk = recordKey?.PK?.S;
    if (!pk || !oldStatus || !newStatus) {
        throw new Error("Missing recordKey or status fields")
    }

    const createdAt = new Date().toISOString();
    const assetSortKey = assetSK ?? recordKey.SK?.S;

    await ddb.send(new TransactWriteCommand({
        TransactItems: [
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        PK: pk,
                        SK: `NOTIFICATION#${event.id}`,
                        entityType: "NOTIFICATION",
                        message: `Status changed ${oldStatus} --> ${newStatus}. Maintenance log created.`,
                        createdAt,
                    },
                },
            },
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        PK: pk,
                        SK: `MAINTENANCE_LOG#${createdAt}#${event.id}`,
                        entityType: "MAINTENANCE_LOG",
                        assetSK: assetSortKey,
                        oldStatus,
                        newStatus,
                        attributes: attributes ?? null,
                        photoUrl: photoUrl ?? null,
                        source: event.source,
                        detailType: event["detail-type"],
                        eventId: event.id,
                        createdAt,
                    },
                    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
                }
            }
        ]
    }))
}