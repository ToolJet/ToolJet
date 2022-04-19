import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');

export default class Woocommerce implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    let result = {};
    const { consumer_key, host, consumer_secret } = sourceOptions;
    const { product_id, order_id, customer_id, data } = queryOptions;

    try {
      switch (operation) {
        case 'list_customer': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.get('customers')
            .then((response) => {
              return response?.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }
        case 'update_customer': {
          console.log('checker', data);
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.put(`customers/${customer_id}`, this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }
        case 'delete_customer': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.delete(`customers/${customer_id}`, {
            force: true,
          })
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'batch_update_customer': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.post('customers/batch', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }
        case 'create_customer': {
          const WooCommerce = this.getClient(sourceOptions);
          console.log('data is ***', data);

          const returned = await WooCommerce.post('customers', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          console.log('return data', returned);
          result = returned;

          break;
        }
        case 'retreive_customer': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.get(`customers/${customer_id}`)
            .then((response) => {
              console.log('check', response.data);

              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }

        // PRODUCTS

        case 'list_product': {
          const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

          const WooCommerce = new WooCommerceRestApi({
            url: host, // Your store URL
            consumerKey: consumer_key, // Your consumer key
            consumerSecret: consumer_secret, // Your consumer secret
            version: 'wc/v3', // WooCommerce WP REST API version
          });
          const data = await WooCommerce.get('products')
            .then((response) => {
              return response?.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          result = data;

          break;
        }
        case 'update_product': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.put(`products/${product_id}`, this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'delete_product': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.delete(`products/${product_id}`, {
            force: true,
          })
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'batch_update_product': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.post('products/batch', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_product': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.post('products', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'retreive_product': {
          const WooCommerce = this.getClient(sourceOptions);
          WooCommerce.get(`products/${product_id}`)
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }
        // ORDERS
        case 'list_order': {
          const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

          const WooCommerce = new WooCommerceRestApi({
            url: host, // Your store URL
            consumerKey: consumer_key, // Your consumer key
            consumerSecret: consumer_secret, // Your consumer secret
            version: 'wc/v3', // WooCommerce WP REST API version
          });
          const data = await WooCommerce.get('orders')
            .then((response) => {
              return response?.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          result = data;
          break;
        }
        case 'update_order': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.put(`orders/${order_id}`, this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case ' delete_order': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.delete(`orders/${order_id}`, {
            force: true,
          })
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'batch_update_order': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.post('orders/batch', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_order': {
          const WooCommerce = this.getClient(sourceOptions);

          result = await WooCommerce.post('orders', this.parseJSON(data))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'retreive_order': {
          const WooCommerce = this.getClient(sourceOptions);
          result = await WooCommerce.get(`orders/${order_id}`)
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });

          break;
        }
        case 'list_coupon': {
          break;
        }
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: any, _options?: object): Promise<any> {
    const { host, consumer_key, consumer_secret } = sourceOptions;
    const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
    const WooCommerce = new WooCommerceRestApi({
      url: host, // Your store URL
      consumerKey: consumer_key, // Your consumer key
      consumerSecret: consumer_secret, // Your consumer secret
      version: 'wc/v3', // WooCommerce WP REST API version
    });
    return WooCommerce;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { host, consumer_key, consumer_secret } = sourceOptions;
    const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
    const WooCommerce = new WooCommerceRestApi({
      url: host, // Your store URL
      consumerKey: consumer_key, // Your consumer key
      consumerSecret: consumer_secret, // Your consumer secret
      version: 'wc/v3', // WooCommerce WP REST API version
    });

    if (!WooCommerce) {
      throw new Error('Invalid credentials');
    }
    return {
      status: 'ok',
    };
  }

  getClient = (sourceOptions: SourceOptions) => {
    const { host, consumer_key, consumer_secret } = sourceOptions;
    const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

    const WooCommerce = new WooCommerceRestApi({
      url: host, // Your store URL
      consumerKey: consumer_key, // Your consumer key
      consumerSecret: consumer_secret, // Your consumer secret
      version: 'wc/v3', // WooCommerce WP REST API version
    });
    return WooCommerce;
  };

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }
}
