import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as custom from 'aws-cdk-lib/custom-resources';
import { generateBatch } from '../shared/util';
import { Books } from '../seed/books';

export class DatabaseStack extends cdk.Stack {
  public readonly booksTable: dynamodb.Table; // 导出供其他 stack 使用

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 创建 DynamoDB 表
    this.booksTable = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'bookId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'Books',
    });

    // 创建自定义资源进行播种
    new custom.AwsCustomResource(this, 'SeedBooksData', {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [this.booksTable.tableName]: generateBatch(Books),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of('SeedBooksData'),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.booksTable.tableArn],
      }),
    });
  }
}
