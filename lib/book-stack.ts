// lib/book-stack.ts
import * as cdk from 'aws-cdk-lib'; // 导入 CDK 核心库
import { Construct } from 'constructs'; // 用于定义构造函数的基础类
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'; // 导入 DynamoDB 模块
import * as lambda from 'aws-cdk-lib/aws-lambda'; // 导入 Lambda 模块
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; // 导入 API Gateway 模块
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";

export class BookStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props); // 初始化 Stack

    // 创建 DynamoDB 表，具有复合主键 userId（分区键）和 bookId（排序键）
    const table = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING }, // 分区键
      sortKey: { name: 'bookId', type: dynamodb.AttributeType.STRING }, // 排序键
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 删除 Stack 时销毁表（仅限开发环境）
      tableName:"Books",
    });

    // 创建 Lambda 函数 postBook，用于添加书籍
    const postBookFn = new lambdanode.NodejsFunction(this, 'PostBookFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // 使用 Node.js 18 运行时
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/postBook.ts`,
      timeout: cdk.Duration.seconds(10),
        memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName, // 将表名注入到环境变量
        REGION: 'eu-west-1',
      },
    });

    // 授予 Lambda 写入 DynamoDB 的权限
    table.grantWriteData(postBookFn);

    // 创建 API Gateway 实例
    const api = new apigateway.RestApi(this, 'BooksApi', {
      restApiName: 'Book Service', // API 名称
      description: 'Book Management REST API', // 描述
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date","X-Api-Key"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER, // 从请求头中读取 API Key
    });

    // 创建 API Key
    const apiKey = api.addApiKey('BookApiKey'); // 创建一个 API Key

    // 创建使用计划
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'BasicUsagePlan', // 使用计划名称
      throttle: { rateLimit: 10, burstLimit: 2 }, // 设置速率限制
    });

    // 将使用计划绑定到 API 阶段
    plan.addApiStage({ stage: api.deploymentStage });

    // 将 API Key 添加到使用计划
    plan.addApiKey(apiKey); // 正确绑定 API Key 到使用计划

    // 创建 /books 路径资源
    const books = api.root.addResource('books'); // 在根路径下添加 books 路由

    // 将 Lambda 函数与 POST 方法绑定，并要求 API Key 授权
    books.addMethod('POST', new apigateway.LambdaIntegration(postBookFn), {
      apiKeyRequired: true, // 启用 API Key 保护
    });
  }
}