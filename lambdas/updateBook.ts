// import { APIGatewayProxyHandler } from 'aws-lambda'; // Lambda 请求处理器类型定义
// import { DynamoDB } from 'aws-sdk'; // 引入 DynamoDB 客户端库

// const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 文档客户端
// const TABLE_NAME = process.env.TABLE_NAME!; // 获取 DynamoDB 表名

// export const handler: APIGatewayProxyHandler = async (event) => {
//   try {
//     const body = JSON.parse(event.body || '{}'); // 解析请求体

//     const { userId, bookId, title, author, description, genre, read, rating } = body;

//     // 基本字段验证
//     if (!userId || !bookId) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ error: 'Missing userId or bookId in request body' }),
//       };
//     }

//     // 构造更新表达式
//     const result = await dynamo.update({
//       TableName: TABLE_NAME,
//       Key: { userId, bookId }, // 指定复合主键
//       UpdateExpression: `set #title = :title, #author = :author, #desc = :desc, #genre = :genre, #read = :read, #rating = :rating`,
//       ExpressionAttributeNames: { //使用#可以避免和保留字冲突
//         '#title': 'title',
//         '#author': 'author',
//         '#desc': 'description',
//         '#genre': 'genre',
//         '#read': 'read',
//         '#rating': 'rating',
//       },
//       ExpressionAttributeValues: {
//         ':title': title,
//         ':author': author,
//         ':desc': description,
//         ':genre': genre,
//         ':read': read ?? false,
//         ':rating': rating ?? undefined,
//       },
//       ReturnValues: 'ALL_NEW', // 返回更新后的新值
//     }).promise();

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ message: 'Book updated', updatedItem: result.Attributes }),
//     };
//   } catch (err) {
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'Failed to update book', detail: (err as Error).message }),
//     };
//   }
// };

import { APIGatewayProxyHandler } from 'aws-lambda'; // Lambda 请求处理器类型定义
import { DynamoDB } from 'aws-sdk'; // 引入 DynamoDB 客户端库

const dynamo = new DynamoDB.DocumentClient(); // 创建 DynamoDB 文档客户端
const TABLE_NAME = process.env.TABLE_NAME!; // 获取环境变量中的表名

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}'); // 解析请求体
    const { userId, bookId, ...fieldsToUpdate } = body; // 拆分主键和其余字段

    if (!userId || !bookId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId or bookId in request body' }),
      };
    }

    // 构造 DynamoDB 动态更新表达式
    const updateParts: string[] = []; // 存储更新表达式片段
    const expressionAttributeNames: Record<string, string> = {}; // 映射属性名
    const expressionAttributeValues: Record<string, any> = {}; // 映射属性值

    let index = 0;
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      const nameKey = `#key${index}`;
      const valueKey = `:val${index}`;
      updateParts.push(`${nameKey} = ${valueKey}`); // 构造表达式
      expressionAttributeNames[nameKey] = key; // 绑定字段名
      expressionAttributeValues[valueKey] = value; // 绑定字段值
      index++;
    }

    // 没有要更新的字段时返回错误
    if (updateParts.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No fields provided to update' }),
      };
    }

    // 执行更新操作
    const result = await dynamo.update({
      TableName: TABLE_NAME, // 目标表名
      Key: { userId, bookId }, // 主键
      UpdateExpression: `set ${updateParts.join(', ')}`, // 最终更新表达式
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW', // 返回更新后的完整记录
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Book updated', updatedItem: result.Attributes }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update book', detail: (err as Error).message }),
    };
  }
};