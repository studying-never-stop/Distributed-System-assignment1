import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { PostBookConstruct } from '../constructs/PostBookConstruct';
import { GetBooksConstruct } from '../constructs/GetBooksConstruct';
import { GetBookConstruct } from '../constructs/GetBookConstruct';
import { UpdateBookConstruct } from '../constructs/UpdateBookConstruct';
import { TranslateBookConstruct } from '../constructs/TranslateBookConstruct';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface LambdaStackProps extends cdk.StackProps {
  table: ITable;
  region: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdas: {
    post: NodejsFunction;
    getAll: NodejsFunction;
    getOne: NodejsFunction;
    update: NodejsFunction;
    translate: NodejsFunction;
  };

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const post = new PostBookConstruct(this, 'PostBook', {
      table: props.table,
      region: props.region,
    });

    const getAll = new GetBooksConstruct(this, 'GetBooks', {
      table: props.table,
      region: props.region,
    });

    const getOne = new GetBookConstruct(this, 'GetBook', {
      table: props.table,
      region: props.region,
    });

    const update = new UpdateBookConstruct(this, 'UpdateBook', {
      table: props.table,
      region: props.region,
    });

    const translate = new TranslateBookConstruct(this, 'TranslateBook', {
      table: props.table,
      region: props.region,
    });

    this.lambdas = {
      post: post.handler,
      getAll: getAll.handler,
      getOne: getOne.handler,
      update: update.handler,
      translate: translate.handler,
    };
  }
}