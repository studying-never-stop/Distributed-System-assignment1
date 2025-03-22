// lib/book-stack.ts
import * as cdk from 'aws-cdk-lib'; // 导入 CDK 核心库
import { Construct } from 'constructs'; // 用于定义构造函数的基础类
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'; // 导入 DynamoDB 模块
import * as lambda from 'aws-cdk-lib/aws-lambda'; // 导入 Lambda 模块
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; // 导入 API Gateway 模块
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as custom from 'aws-cdk-lib/custom-resources';

import { Books } from '../seed/books'; // 引入原始播种数据
import { generateBatch } from '../shared/util'; // 引入批量格式化函数

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

    const getBooksFn = new lambdanode.NodejsFunction(this, 'GetBooksFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/getBooks.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1',
      },
    });

    const getBookFn = new lambdanode.NodejsFunction(this, 'GetBookFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/getBook.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1',
      },
    });

 // 自动播种数据：通过 AwsCustomResource + batchWriteItem 实现

    // 创建一个自定义资源，在 CDK 部署时执行 DynamoDB 的 batchWriteItem 操作
    new custom.AwsCustomResource(this, 'SeedBooksData', {
      onCreate: {
        // 指定要调用的 AWS 服务和操作
        // 此处是调用 DynamoDB 的 batchWriteItem 方法
        service: 'DynamoDB', // 使用 DynamoDB 服务
        action: 'batchWriteItem', // 执行批量写入操作
        parameters: {
          // 设置请求参数，包含要写入的数据
          RequestItems: {
            // 动态设置目标表名并传入批量数据
            [table.tableName]: generateBatch(Books), // 表名为 BooksTable，值为写入请求数组
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of('SeedBooksData'), // 用于标识该资源的唯一性，防止重复创建
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        // 授予该自定义资源访问 DynamoDB 表的权限
        resources: [table.tableArn], // 允许访问 BooksTable 表
      }),
    });

    // 授予 Lambda 写入 DynamoDB 的权限
    table.grantWriteData(postBookFn);
    table.grantReadData(getBooksFn);
    table.grantReadData(getBookFn);

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

    books.addMethod('GET', new apigateway.LambdaIntegration(getBooksFn), {
      apiKeyRequired: true,
    });

    const bookById = books.addResource('book').addResource('{bookId}');
    bookById.addMethod('GET', new apigateway.LambdaIntegration(getBookFn), {
      apiKeyRequired: true,
    });
    
  }
}