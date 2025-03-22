import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from './database-stack';
import { LambdaStack } from './lambda-stack';
import { ApiStack } from './api-stack';

const app = new cdk.App();

// 部署区域与账户信息（可选配置）
const env = {
  region: 'eu-west-1',
};

// 创建数据库堆栈
const databaseStack = new DatabaseStack(app, 'DatabaseStack', { env });

// 创建 Lambda 堆栈，并传入表实例
const lambdaStack = new LambdaStack(app, 'LambdaStack', {
    env,
    region: env.region, 
    table: databaseStack.booksTable,
  });

// 创建 API 网关堆栈，绑定所有 Lambda handler
new ApiStack(app, 'ApiStack', {
  env,
  table: databaseStack.booksTable,
  lambdas: lambdaStack.lambdas,
});
