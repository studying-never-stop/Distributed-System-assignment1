import { Construct } from 'constructs'; // 基础构造类
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Node.js Lambda 构造
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda'; // Lambda 配置
import { ITable } from 'aws-cdk-lib/aws-dynamodb'; // DynamoDB 表接口类型
import * as cdk from 'aws-cdk-lib'; // Duration 等工具

// 构造参数类型：需要表和区域
export interface PostBookConstructProps {
  table: ITable;
  region: string;
}

// 自定义构造：封装 postBook Lambda 创建逻辑
export class PostBookConstruct extends Construct {
  public readonly handler: NodejsFunction; // 暴露 handler 给 API Gateway 使用

  constructor(scope: Construct, id: string, props: PostBookConstructProps) {
    super(scope, id);

    // 创建 Lambda 函数实例
    this.handler = new NodejsFunction(this, 'PostBookFunction', {
      entry: `${__dirname}/../lambdas/postBook.ts`,
      runtime: Runtime.NODEJS_18_X, // 运行时环境
      architecture: Architecture.ARM_64, // ARM 架构以减少成本
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.table.tableName, // 注入 DynamoDB 表名
        REGION: props.region,
      },
    });

    // 授权写入 DynamoDB
    props.table.grantWriteData(this.handler);
  }
}