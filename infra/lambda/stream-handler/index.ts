import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { DynamoDBStreamEvent } from 'aws-lambda';

const events = new EventBridgeClient({});

export const handler = async (event: DynamoDBStreamEvent) => {
    for (const record of event.Records) {
        if (record.eventName !== 'MODIFY') {
            continue;
        }

        const oldStatus = record.dynamodb?.OldImage?.status?.S;
        const newStatus = record.dynamodb?.NewImage?.status?.S;

        if (oldStatus !== newStatus && newStatus === 'In Maintenance') {
            await events.send(new PutEventsCommand({
                Entries: [{
                    Source: 'assetiq.records',
                    DetailType: "AssetStatusChanged",
                    Detail: JSON.stringify({
                        recordKey: record.dynamodb?.Keys,
                        oldStatus,
                        newStatus,
                        assetSK: record.dynamodb?.Keys?.SK?.S,
                        attributes: record.dynamodb?.NewImage?.attributes,
                        photoUrl: record.dynamodb?.NewImage?.photoUrl?.S ?? null,
                    })
                }]
            }))
        }
    }
}