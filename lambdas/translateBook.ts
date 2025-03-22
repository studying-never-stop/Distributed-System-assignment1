// lambdas/translateBook.ts

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB, Translate } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const translator = new Translate();
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    const bookId = event.pathParameters?.bookId;
    const language = event.queryStringParameters?.language;

    if (!userId || !bookId || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId, bookId, or language in request' }),
      };
    }

    // 获取图书记录
    const { Item } = await dynamo.get({
      TableName: TABLE_NAME,
      Key: { userId, bookId },
    }).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Book not found' }),
      };
    }

    const originalDescription = Item.description;
    const cachedTranslation = Item.translations?.[language];

    // 如果已有缓存，直接返回
    if (cachedTranslation) {
      return {
        statusCode: 200,
        body: JSON.stringify({ translated: cachedTranslation, cached: true }),
      };
    }

    // 调用 Amazon Translate
    const translated = await translator.translateText({
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
      Text: originalDescription,
    }).promise();

    const translatedText = translated.TranslatedText;

    // ✅ 修复：确保 translations 是 map，动态更新语言字段
    await dynamo.update({
      TableName: TABLE_NAME,
      Key: { userId, bookId },
      UpdateExpression: 'set #translations.#lang = :text',
      ExpressionAttributeNames: {
        '#translations': 'translations',
        '#lang': language,
      },
      ExpressionAttributeValues: {
        ':text': translatedText,
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ translated: translatedText, cached: false }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Translation failed', detail: (err as Error).message }),
    };
  }
};