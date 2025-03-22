import * as cdk from 'aws-cdk-lib'; // 导入 AWS CDK 核心库
import { BookStack } from '../lib/book-stack'; // 导入我们自定义的 Stack 类

const app = new cdk.App(); // 创建一个 CDK 应用实例
new BookStack(app, 'BookStack', { env: { region: "eu-west-1" } }); // 初始化并部署 BookStack 堆栈