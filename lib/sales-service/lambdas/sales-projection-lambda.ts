import { EventBridgeHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

type Event = {
  'product-id': number
  'sold-on': number
}

const client = new DocumentClient()

export const handler: EventBridgeHandler<string, Event, number> = async (event, _ctx) => {

  console.log('Got Sales event', event['detail-type'])
  console.log('Type', event.detail)
  console.log('Source', event.source)
  console.log('Resources', event.resources)
  try {
    const results = await client.update({
      Key: { 'product-id': event.detail['product-id'] },
      TableName: process.env.TABLE_NAME || '',
      UpdateExpression: 'SET sales = sales + :inc',
      ExpressionAttributeValues: { ':inc': 1 },
      ReturnValues: "ALL_NEW"
    }).promise()

    console.log({ results })
    console.log({ Sales: results.Attributes?.sales })
  } catch (e) {
    console.error('Error updating table', e)
    return -1
  }
  return 1
}