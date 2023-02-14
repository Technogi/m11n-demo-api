import { EventBridgeHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

type Event = {
  'product-id': number
  'sold-on': number
}

const client = new DocumentClient()

export const handler: EventBridgeHandler<string, Event, number> = async (event, _ctx) => {

  return 1
}