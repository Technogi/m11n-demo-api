import { EventBridge } from 'aws-sdk'
import { products } from '../../lib/products-catalog';

const eventBus = new EventBridge({
  region: 'us-east-1'
})

const run = async () => {
  var product = products[Math.floor(Math.random() * products.length)];

  await eventBus.putEvents({
    Entries: [{
      EventBusName: 'm11n-hermes',
      DetailType: 'NewSale',
      Source: 'pos',
      Detail: JSON.stringify({
        product_id: product.id,
        sold_on: Date.now()
      })
    }],
  }).promise()
}

run().then(() => console.log('Done')).catch(e => {
  console.error(e)
  process.exit(1)
})