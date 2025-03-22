import { Construct } from 'constructs'; // 基础构造类
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Node.js Lambda 构造
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda'; // Lambda 配置
import { ITable } from 'aws-cdk-lib/aws-dynamodb'; // DynamoDB 表接口类型
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'; // IAM 策略
import * as cdk from 'aws-cdk-lib'; // 导入 CDK 核心库

// 构造类参数类型
export interface TranslateBookConstructProps {
  table: ITable; // DynamoDB 表
  region: string; // 所在区域
}

// 自定义构造：封装翻译功能相关的 Lambda 创建与权限配置
export class TranslateBookConstruct extends Construct {
  public readonly handler: NodejsFunction; // 暴露给外部的 Lambda 函数实例

  constructor(scope: Construct, id: string, props: TranslateBookConstructProps) {
    super(scope, id); // 初始化构造

    // 创建 Lambda 函数：translateBook
    this.handler = new NodejsFunction(this, 'TranslateBookFn', {
      entry: `${__dirname}/../lambdas/translateBook.ts`, // Lambda 文件路径
      runtime: Runtime.NODEJS_18_X, // 使用 Node.js 18
      architecture: Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10), // 执行超时 10 秒
      memorySize: 128, // 分配内存
      environment: {
        TABLE_NAME: props.table.tableName, // 注入 DynamoDB 表名
        REGION: props.region,
      },
    });

    // 授予该函数访问 DynamoDB 表的读写权限
    props.table.grantReadWriteData(this.handler);

    // 授予该函数调用 Amazon Translate 的权限
    this.handler.addToRolePolicy(
      new PolicyStatement({
        actions: ['translate:TranslateText'], // 允许使用 translateText API
        resources: ['*'], // 所有资源（你也可以指定具体 ARN）
      })
    );
  }
}
