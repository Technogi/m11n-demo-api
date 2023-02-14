import { CdkCustomResourceHandler } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { products } from '../../products-catalog'

export const handler: CdkCustomResourceHandler = async (event, ctx) => {

  if (event.RequestType === 'Delete') {
    const client = new DocumentClient()
    await Promise.all(products.map(({ id }) => client.delete({
      TableName: process.env.TABLE_NAME || '',
      Key: { product_id: id }
    }).promise()))
  }

  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    const client = new DocumentClient()
    await client.batchWrite({
      RequestItems: {
        [process.env.TABLE_NAME || '']: products.map(({ id, name, price }) => ({
          PutRequest: {
            Item: {
              'product-id': id,
              name,
              price,
              sales: 0
            }
          }
        }))
      }
    }).promise()
  }

  return {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: ctx.logGroupName,
  }
}