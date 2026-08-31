import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

export const osClient = new Client({
    ...AwsSigv4Signer({
        region: process.env.AWS_REGION!,
        service: 'es',
        getCredentials: () => defaultProvider()(),
    }),
    node: process.env.OPENSEARCH_ENDPOINT,
})