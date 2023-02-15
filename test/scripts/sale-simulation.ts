import { EventBridge } from 'aws-sdk'
import { products } from '../../lib/products-catalog';

const eventBus = new EventBridge({
  region: 'us-east-1'
})

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}
const run = async () => {

  for (let i = 0; i < 200; i++) {
    var product = products[Math.floor(Math.random() * products.length)];
    if (product.id % 4) {
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

      await delay(100)
    }
  }
}


run().then(() => console.log('Done')).catch(e => {
  console.error(e)
  process.exit(1)
})