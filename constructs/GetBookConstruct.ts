import { Construct } from 'constructs'; // CDK 构造基类
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Node.js Lambda 构造
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda'; // Lambda 配置项
import { ITable } from 'aws-cdk-lib/aws-dynamodb'; // DynamoDB 表类型接口
import * as cdk from 'aws-cdk-lib'; // Duration 等工具


// 构造参数定义
export interface GetBookConstructProps {
  table: ITable;
  region: string;
}

// 自定义构造：封装获取单本图书的 Lambda 函数逻辑
export class GetBookConstruct extends Construct {
  public readonly handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: GetBookConstructProps) {
    super(scope, id);

    this.handler = new NodejsFunction(this, 'GetBookFunction', {
      entry: `${__dirname}/../lambdas/getBook.ts`,
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
