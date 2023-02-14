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
      Source: 'pos:m11n',
      DetailType: 'NewSale',
      Detail: JSON.stringify({
        'event-type': 'NewSale',
        'product-id': product.id,
        'sold-on': 1676332922655,
        tenant: 'technogi'
      })
    }],
  }).promise()
}

run().then(() => console.log('Done')).catch(e => {
  console.error(e)
  process.exit(1)
})