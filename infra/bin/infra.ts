#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AssetIqStack } from '../lib/asset-iq-stack';

const app = new cdk.App();
new AssetIqStack(app, 'AssetIqStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
