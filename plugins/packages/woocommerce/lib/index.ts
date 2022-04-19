import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');

export default class Woocommerce implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const operation = queryOptions.operation;
    let result = {};
    const { product_id, order_id, customer_id, body } = queryOptions;
    const WooCommerce = await this.getConnection(sourceOptions);

    try {
      switch (operation) {
        case 'list_customer': {
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
          console.log('checker', body);
          result = await WooCommerce.put(`customers/${customer_id}`, this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'delete_customer': {
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
          result = await WooCommerce.post('customers/batch', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_customer': {
          const returned = await WooCommerce.post('customers', this.parseJSON(body))
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
          result = await WooCommerce.get('products')
            .then((response) => {
              return response?.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'update_product': {
          result = await WooCommerce.put(`products/${product_id}`, this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'delete_product': {
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
          result = await WooCommerce.post('products/batch', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_product': {
          result = await WooCommerce.post('products', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'retreive_product': {
          result = await WooCommerce.get(`products/${product_id}`)
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
          result = await WooCommerce.get('orders')
            .then((response) => {
              return response?.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'update_order': {
          result = await WooCommerce.put(`orders/${order_id}`, this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'delete_order': {
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
          result = await WooCommerce.post('orders/batch', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_order': {
          result = await WooCommerce.post('orders', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'retreive_order': {
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
          result = await WooCommerce.get(`coupons`)
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
          break;
        }
        case 'create_coupon': {
          result = await WooCommerce.post('coupons', this.parseJSON(body))
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              return error.response.data;
            });
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
    const client = await WooCommerce.get('system_status')
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        return error.response.data;
      });
    if (client?.data?.status == '401') {
      throw new Error('Invalid credentials');
    }
    return {
      status: 'ok',
    };
  }

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }
}
