// lambdas/getBook.ts

import { APIGatewayProxyHandler } from 'aws-lambda'; // Lambda 请求处理器类型定义
import { DynamoDB } from 'aws-sdk'; // 引入 DynamoDB 客户端库

const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 文档客户端
const TABLE_NAME = process.env.TABLE_NAME!; // 从环境变量中获取表名

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const bookId = event.pathParameters?.bookId; // 从路径参数中提取 bookId

    if (!bookId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing bookId in path' }),
      };
    }

    // 使用 scan 和 FilterExpression 查找匹配 bookId 的书籍（注意性能开销）
    const result = await dynamo.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'bookId = :bid',
      ExpressionAttributeValues: {
        ':bid': bookId,
      },
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Book not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items), // 返回匹配的书籍（理论上最多一个）
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch book', detail: (err as Error).message }),
    };
  }
};
