import { APIGatewayProxyHandler } from 'aws-lambda'; // 引入 Lambda 处理器类型
import { DynamoDB } from 'aws-sdk'; // 引入 AWS SDK 的 DynamoDB 客户端
import { createBook } from '../shared/util'; // 引入创建书籍的工厂函数
import { CreateBookInput } from '../shared/types'; // 引入创建书籍的输入类型

const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 的文档客户端
const TABLE_NAME = process.env.TABLE_NAME!; // 从环境变量中读取表名

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body!); // 解析请求体
    const input: CreateBookInput = body; // 类型断言为 CreateBookInput

    const book = createBook(input); // 使用工厂函数创建完整书籍对象

    // 将书籍对象写入 DynamoDB
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: book,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Book added!', bookId: book.bookId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not add book', detail: (error as Error).message }),
    };
  }
};
