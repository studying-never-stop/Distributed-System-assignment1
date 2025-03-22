import { APIGatewayProxyHandler } from 'aws-lambda'; // Lambda 请求处理器类型定义
import { DynamoDB } from 'aws-sdk'; // 引入 DynamoDB 客户端库

const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 文档客户端
const TABLE_NAME = process.env.TABLE_NAME!; // 从环境变量中获取表名

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId; // 从路径参数中提取 userId

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId in path' }),
      };
    }

    // 查询指定 userId 的所有图书
    const result = await dynamo.query({
      TableName: TABLE_NAME, // 指定表名
      KeyConditionExpression: 'userId = :uid', // 查询条件表达式
      ExpressionAttributeValues: {
        ':uid': userId, // 设置占位符对应值
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items), // 返回查询到的所有图书项
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch books', detail: (err as Error).message }),
    };
  }
};
