import { APIGatewayProxyHandler } from 'aws-lambda'; 
import { DynamoDB } from 'aws-sdk'; 

const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 文档客户端
const TABLE_NAME = process.env.TABLE_NAME!; // 从环境变量中获取表名

export const handler: APIGatewayProxyHandler = async () => {
  try {
    // 扫描整个表，获取所有书籍记录（仅用于开发或小表）
    const result = await dynamo.scan({
      TableName: TABLE_NAME, // 要扫描的表名
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items), // 返回所有书籍项
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch books', detail: (err as Error).message }),
    };
  }
};
