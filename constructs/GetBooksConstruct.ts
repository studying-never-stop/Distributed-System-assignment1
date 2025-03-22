import { Construct } from 'constructs'; // CDK 基础构造类
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Node.js Lambda 构造
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda'; // Lambda 配置项
import { ITable } from 'aws-cdk-lib/aws-dynamodb'; // DynamoDB 表接口
import * as cdk from 'aws-cdk-lib'; // Duration 工具
import * as path from 'path'; // 路径模块

// 构造参数接口
export interface GetBooksConstructProps {
  table: ITable;
  region: string;
}

// 自定义构造：封装获取所有书籍的 Lambda 逻辑
export class GetBooksConstruct extends Construct {
  public readonly handler: NodejsFunction; // 暴露 handler

  constructor(scope: Construct, id: string, props: GetBooksConstructProps) {
    super(scope, id);

    this.handler = new NodejsFunction(this, 'GetBooksFunction', {
      entry: path.join(__dirname, '../lambdas/getBooks.ts'), // Lambda 入口
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.table.tableName,
        REGION: props.region,
      },
    });

    // 授权读取 DynamoDB 表
    props.table.grantReadData(this.handler);
  }
}
