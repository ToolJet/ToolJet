import { QueryOptions } from './types';
const JSON5 = require('json5');

function parseJSON(json: any) {
  if (!json) {
    return {};
  }
  return JSON5.parse(json);
}

export async function customerOpeations(WooCommerce, queryOptions: QueryOptions, operation: string) {
  const { customer_id, body } = queryOptions;
  let returnValue = {};
  switch (operation) {
    case 'list_customer': {
      const data = await WooCommerce.get('customers')
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
      return data;
    }
    case 'update_customer': {
      return await WooCommerce.put(`customers/${customer_id}`, parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'delete_customer': {
      return await WooCommerce.delete(`customers/${customer_id}`, {
        force: true,
      })
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'batch_update_customer': {
      return await WooCommerce.post('customers/batch', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'create_customer': {
      return await WooCommerce.post('customers', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'retreive_customer': {
      return await WooCommerce.get(`customers/${customer_id}`)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function productOperations(WooCommerce, queryOptions: QueryOptions, operation: string) {
  const { product_id, body } = queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_product': {
      return await WooCommerce.get('products')
        .then((response) => {
          return response?.data;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'update_product': {
      return await WooCommerce.put(`products/${product_id}`, parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'delete_product': {
      return await WooCommerce.delete(`products/${product_id}`, {
        force: true,
      })
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'batch_update_product': {
      return await WooCommerce.post('products/batch', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'create_product': {
      return await WooCommerce.post('products', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'retreive_product': {
      return await WooCommerce.get(`products/${product_id}`)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function orderOperations(WooCommerce, queryOptions: QueryOptions, operation: string) {
  const { order_id, body } = queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_order': {
      return await WooCommerce.get('orders')
        .then((response) => {
          return response?.data;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'update_order': {
      return await WooCommerce.put(`orders/${order_id}`, parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'delete_order': {
      return await WooCommerce.delete(`orders/${order_id}`, {
        force: true,
      })
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'batch_update_order': {
      return await WooCommerce.post('orders/batch', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'create_order': {
      return await WooCommerce.post('orders', parseJSON(body))
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'retreive_order': {
      return await WooCommerce.get(`orders/${order_id}`)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function couponOperations(WooCommerce, queryOptions: QueryOptions, operation: string) {
  const { body } = queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_coupon': {
      return await WooCommerce.get(`coupons`)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    case 'create_coupon': {
      return await WooCommerce.post('coupons', parseJSON(body))
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          return error.response.data;
        });
    }
    default:
      throw Error('Invalid operation');
  }
}
