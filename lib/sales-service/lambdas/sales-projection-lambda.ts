import { EventBridgeHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

type Event = {
  product_id: number
  sold_on: number
}

const client = new DocumentClient()

export const handler: EventBridgeHandler<string, Event, number> = async (event, _ctx) => {

  const results = await client.update({
    Key: { product_id: event.detail.product_id },
    TableName: process.env.TABLE_NAME || '',
    UpdateExpression: 'SET sales = sales + :inc',
    ExpressionAttributeValues: { ':inc': 1 },
    ReturnValues: "ALL_NEW"
  }).promise()

  console.log({ results })
  console.log({ Sales: results.Attributes?.sales })
  return 1
}