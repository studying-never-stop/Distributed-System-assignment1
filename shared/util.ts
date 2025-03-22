import { v4 as uuidv4 } from 'uuid'; // 引入 uuid 生成唯一 ID
import { Book, CreateBookInput } from './types'; // 引入共享类型
import { DynamoDB } from 'aws-sdk';

// 工厂函数：根据 CreateBookInput 构建完整 Book 对象
export function createBook(input: CreateBookInput): Book {
  return {
    userId: input.userId,
    bookId: uuidv4(), // 自动生成唯一 bookId
    title: input.title,
    author: input.author,
    description: input.description,
    genre: input.genre,
    read: input.read ?? false, // 默认未读
    rating: input.rating ?? undefined, // 默认无评分
    translations: { en: input.description }, // 初始化为空翻译缓存
  };
}

// 将 Book 类型数据转换为 DynamoDB batchWriteItem 所需格式
export function generateBatch(books: Book[]): DynamoDB.Types.WriteRequests {
  return books.map((b) => {
    const item = convertToDynamoFormat(b);
    return {
      PutRequest: { Item: item },
    };
  });
}

// 辅助函数：将 JS 对象转为 DynamoDB 格式
function convertToDynamoFormat(book: Book): DynamoDB.AttributeMap {
  return DynamoDB.Converter.marshall(book);
}