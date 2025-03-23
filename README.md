## Serverless REST Assignment - Distributed Systems.

__Name:__ Wu Songyu

__Demo:__ https://youtu.be/XNNDFvGtnNE

### Context.

use : "npx cdk deploy --all" to start

Book Management System

Table item attributes:
- `userId` - string  (Partition key)
- `bookId` - string  (Sort key)
- `title` - string
- `author` - string
- `description` - string
- `genre` - string
- `read` - boolean (optional)
- `rating` - number (optional)
- `translations` - map of language codes to translated descriptions (e.g., `{en: "...", fr: "...", zh: "..." }`)

---

### App API Endpoints.

- `POST /books` – Add a new book *(API Key required)*
- `GET /books` – Get all books *(API Key required)*
- `PUT /books` – Update a book *(API Key required)*
- `GET /books/book/{bookId}` – Get a single book by bookId *(API Key required)*
- `GET /books/{userId}/{bookId}/translation?language=fr` – Translate a book's description *(API Key required)*

---

### Features.

#### API Key Authentication

All endpoints are protected using API Gateway's API Key mechanism, ensuring that only authorized users can access the service. The system automatically creates an API Key and a usage plan during deployment, with throttling limits to prevent abuse.

**Key Features:**
- All routes have `apiKeyRequired: true` enabled
- A usage plan is configured to limit request rates
- API Key is passed through the `X-Api-Key` request header

Example Code:
~~~ts
const api = new apigateway.RestApi(this, 'BooksApi', {
  apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
});

const apiKey = api.addApiKey('BookApiKey');
const plan = api.addUsagePlan('UsagePlan', {
  throttle: { rateLimit: 10, burstLimit: 2 },
});
plan.addApiStage({ stage: api.deploymentStage });
plan.addApiKey(apiKey);
~~~

#### Translation Persistence

Amazon Translate is used to translate a book's description to a target language using the `TranslateText` API. To avoid repeated translation calls, the system caches the translated description directly into the `translations` attribute in the DynamoDB item.

Example structure:
- `userId`: "user001"
- `bookId`: "abc123"
- `title`: "The Great Gatsby"
- `description`: "A classic American novel."
- `translations`: {
  - `fr`: "Un roman américain classique."
  - `zh`: "一部经典的美国小说"
}

#### Custom L2 Construct 

We created multiple custom constructs to modularize infrastructure logic for each Lambda function.

Construct Input props object:
~~~ts
interface TranslateBookConstructProps {
  table: ITable;
  region: string;
}
~~~

Construct public properties:
~~~ts
export class TranslateBookConstruct extends Construct {
  public readonly handler: NodejsFunction;
  // ...
}
~~~

Each Lambda (Post, Get, Update, Translate) is encapsulated in its own construct for better reusability and clarity.

#### Multi-Stack App 

The CDK app is split into **three stacks** for better maintainability:
- `DatabaseStack` – Creates DynamoDB table and seeds initial data
- `LambdaStack` – Creates and configures all Lambda functions via custom constructs
- `ApiStack` – Creates API Gateway, configures resources and routes, binds to Lambda handlers

Main entry is managed via `app.ts`.

#### Lambda Layers 

Not used in this project, but could be integrated later for shared utilities.

#### API Keys 

API Gateway is configured to require API keys for all endpoints. Usage Plan is set up with throttling.

~~~ts
const api = new apigateway.RestApi(this, 'BooksApi', {
  apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
});

const apiKey = api.addApiKey('BookApiKey');
const plan = api.addUsagePlan('UsagePlan', {
  throttle: { rateLimit: 10, burstLimit: 2 },
});
plan.addApiStage({ stage: api.deploymentStage });
plan.addApiKey(apiKey);
~~~

---

### Extra (If relevant).

- Fully automated seeding via `AwsCustomResource` with `batchWriteItem` on table create
- Translations cached using `UpdateExpression` with nested map syntax: `set translations.#lang = :text`
- Architecture supports easy future expansion into search/filtering, Cognito auth, and Lambda Layers

---
 Built with AWS CDK v2, Node.js 18 Lambda runtime, TypeScript, and DynamoDB (PAY_PER_REQUEST mode).
 Designed for clarity, modularity, and maintainability.