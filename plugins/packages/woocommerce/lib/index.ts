import { QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { customerOpeations, productOperations, orderOperations, couponOperations } from './operation';
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
export default class Woocommerce implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const WooCommerce = await this.getConnection(sourceOptions);
    const { resource, operation } = queryOptions;
    let result: any;

    switch (resource) {
      case 'customer':
        result = await customerOpeations(WooCommerce, queryOptions, operation);
        break;
      case 'product':
        result = await productOperations(WooCommerce, queryOptions, operation);
        break;
      case 'order':
        result = await orderOperations(WooCommerce, queryOptions, operation);
        break;
      case 'coupon':
        result = await couponOperations(WooCommerce, queryOptions, operation);
        break;
    }

    return {
      status: 'ok',
      data: result,
    };
  }
  async getConnection(sourceOptions: any, _options?: object): Promise<any> {
    const { host, consumer_key, consumer_secret } = sourceOptions;
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
      .catch(() => {
        throw new Error('Invalid credentials');
      });
    if (client?.data?.status == '401') {
      throw new Error('Invalid credentials');
    }
    return {
      status: 'ok',
    };
  }
}
