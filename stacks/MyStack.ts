import { StackContext, Api, use } from "@serverless-stack/resources";
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from "@aws-cdk/core";
import * as sst from '@serverless-stack/resources';
import cdk = require('aws-cdk-lib');
import events = require('aws-cdk-lib/aws-events');
import targets = require('aws-cdk-lib/aws-events-targets');
import lambda = require('aws-cdk-lib/aws-lambda');
import fs = require('fs');
  
export function MyStack({ stack }: StackContext) {
	const api = new Api(stack, "api", {
	//customDomain:app.stage === "prod" ? "api.example.com" : undefined,
    routes: {
			"GET /hello": "functions/lambda.handler",
		},
	});
  
	
	//Lambda CronFunction 
	const lambdaFn = new lambda.Function(this, 'CronFunction', {
		code: new lambda.InlineCode(fs.readFileSync('services/functions/lambda-handler.py', { encoding: 'utf-8' })),
		handler: 'index.main',
        timeout: cdk.Duration.seconds(300),
		runtime: lambda.Runtime.NODEJS_16_X,
	});

	// Runs every monday at 3AM UTC
	const rule = new events.Rule(this, 'Rule', {
		schedule: events.Schedule.expression('cron(0 3 ? * MON *)')
	});
	
	rule.addTarget(new targets.LambdaFunction(lambdaFn));
  	
	const s3bucketStack = use(MyS3Stack);
	s3bucketStack.myBucket.grantWrite(lambdaFn);	
	
	stack.addOutputs({
		
		ApiEndpoint: api.url //||api.customDomainUrl,
	});
}
export function MyS3Stack({ stack }: StackContext) {  
	
	//S3 bucket
	const myBucket = new s3.Bucket(this, "ik-techcheck", {
		bucketName: "ik-techcheck",
	});
	return {myBucket};
}
