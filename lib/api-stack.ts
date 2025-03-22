import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ApiStackProps extends cdk.StackProps {
  table: ITable;
  lambdas: {
    post: NodejsFunction;
    getAll: NodejsFunction;
    getOne: NodejsFunction;
    update: NodejsFunction;
    translate: NodejsFunction;
  };
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // 创建 API 网关
    const api = new apigateway.RestApi(this, 'BooksApi', {
      restApiName: 'Book Service',
      description: 'Book Management REST API',
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'X-Api-Key'],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // 创建 API Key
    const apiKey = api.addApiKey('BookApiKey');

    // 创建使用计划
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'BasicUsagePlan',
      throttle: { rateLimit: 10, burstLimit: 2 },
    });

    // 绑定使用计划到部署阶段
    plan.addApiStage({ stage: api.deploymentStage });
    plan.addApiKey(apiKey);

    // 创建主资源路径 /books
    const books = api.root.addResource('books');

    // POST /books
    books.addMethod('POST', new apigateway.LambdaIntegration(props.lambdas.post), {
      apiKeyRequired: true,
    });

    // GET /books
    books.addMethod('GET', new apigateway.LambdaIntegration(props.lambdas.getAll), {
      apiKeyRequired: true,
    });

    // PUT /books
    books.addMethod('PUT', new apigateway.LambdaIntegration(props.lambdas.update), {
      apiKeyRequired: true,
    });

    // GET /books/book/{bookId}
    const bookById = books.addResource('book').addResource('{bookId}');
    bookById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdas.getOne), {
      apiKeyRequired: true,
    });

    // GET /books/{userId}/{bookId}/translation?language=xx
    const translation = books
      .addResource('{userId}')
      .addResource('{bookId}')
      .addResource('translation');
    translation.addMethod('GET', new apigateway.LambdaIntegration(props.lambdas.translate), {
      apiKeyRequired: true,
    });
  }
}
