import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { DynamoEventSource, SqsDlq } from 'aws-cdk-lib/aws-lambda-event-sources';

export class AssetIqStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.Table(this, 'AssetIqTable', {
            tableName: "assetiq-table",
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        table.addGlobalSecondaryIndex({
            indexName: "GSI1",
            partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
        });

        const bucket = new s3.Bucket(this, 'AssetIqPhotos', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [{
                allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
            }],
        });

        const streamDql = new sqs.Queue(this, 'StreamDlq');

        const streamHandler = new nodejs.NodejsFunction(this, 'StreamHandler', {
            entry: '../lambda/stream-handler/index.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
        });

        streamHandler.addEventSource(new DynamoEventSource(table, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 10,
            retryAttempts: 3,
            onFailure: new SqsDlq(streamDql),
        }));

        streamHandler.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['events:PutEvents'],
            resources: ['*'],
        }));

        const maintenanceConsumer = new nodejs.NodejsFunction(this, 'MaintenanceConsumer', {
            entry: '../lambda/maintenance-consumer/index.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            environment: { TABLE_NAME: table.tableName },
        }) ;

        table.grantWriteData(maintenanceConsumer);

        new events.Rule(this, 'AssetStatusChangedRule', {
            eventPattern: { source: ['assetiq.records'], detailType: ['AssetStatusChanged'] },
            targets: [new targets.LambdaFunction(maintenanceConsumer)]
        });

        new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
        new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    }
}