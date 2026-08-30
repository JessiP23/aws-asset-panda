import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
    const { recordKey, oldStatus, newStatus } = event.detail;
    const pk = recordKey.PK.S;

    await ddb.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
            PK: pk,
            SK: `NOTIFICATION${Date.now()}`,
            message: `Status changed ${oldStatus} -> ${newStatus}. Maintenance log created.`,
            createdAt: new Date().toISOString(),
        },
    }));
    // TODO: also write a proper MAINTENANCE_LOG# item with more detail

}