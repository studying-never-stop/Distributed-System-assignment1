import { Construct } from 'constructs'; // CDK 基础构造类
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Node.js Lambda 构造
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda'; // Lambda 配置
import { ITable } from 'aws-cdk-lib/aws-dynamodb'; // DynamoDB 表类型
import * as cdk from 'aws-cdk-lib'; // Duration 工具等
import * as path from 'path'; // 路径模块

// 构造函数参数类型
export interface UpdateBookConstructProps {
  table: ITable;
  region: string;
}

// 封装 updateBook Lambda 的自定义构造
export class UpdateBookConstruct extends Construct {
  public readonly handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: UpdateBookConstructProps) {
    super(scope, id);

    this.handler = new NodejsFunction(this, 'UpdateBookFunction', {
      entry: path.join(__dirname, '../lambdas/updateBook.ts'),
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.table.tableName,
        REGION: props.region,
      },
    });

    // 授权写入 DynamoDB
    props.table.grantWriteData(this.handler);
  }
}
