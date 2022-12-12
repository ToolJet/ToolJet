import { QueryOptions } from './types';
const JSON5 = require('json5');

function parseJSON(json: any) {
  if (!json) {
    return {};
  }
  return JSON5.parse(json);
}

export async function customerOpeations(WooCommerce, queryOptions: QueryOptions, operation: string) {
  const { customer_id, body, page, context, per_page, search, exclude, include, offset, order, orderby, email, role } =
    queryOptions;
  let returnValue = {};
  switch (operation) {
    case 'list_customer': {
      const searchParams = {
        ...(context?.length > 0 && { context }),
        ...(page && { page }),
        ...(per_page && { per_page }),
        ...(search?.length > 0 && { search }),
        ...(exclude?.length > 0 && { exclude }),
        ...(include?.length > 0 && { include }),
        ...(offset && { offset }),
        ...(order && { order }),
        ...(orderby?.length > 0 && { orderby }),
        ...(email?.length > 0 && { email }),
        ...(role?.length > 0 && { role }),
      };
      const data = await WooCommerce.get('customers', searchParams)
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
    case 'retrieve_customer': {
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
  const {
    product_id,
    body,
    page,
    context,
    per_page,
    search,
    exclude,
    include,
    offset,
    order,
    orderby,
    slug,
    status,
    type,
    sku,
    featured,
    category,
    tag,
    shipping_class,
    attribute,
    attribute_term,
    tax_class,
    on_sale,
    min_price,
    max_price,
    stock_status,
    before,
    after,
    parent_exclude,
    parent,
  } = queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_product': {
      const searchParams = {
        ...(context?.length > 0 && { context }),
        ...(page && { page }),
        ...(per_page && { per_page }),
        ...(search?.length > 0 && { search }),
        ...(exclude?.length > 0 && { exclude }),
        ...(include?.length > 0 && { include }),
        ...(offset && { offset }),
        ...(order && { order }),
        ...(orderby?.length > 0 && { orderby }),
        ...(slug?.length > 0 && { slug }),
        ...(status?.length > 0 && { status }),
        ...(type && { type }),
        ...(sku?.length > 0 && { sku }),
        ...(featured && { featured }),
        ...(category?.length > 0 && { category }),
        ...(tag?.length > 0 && { tag }),
        ...(shipping_class && { shipping_class }),
        ...(attribute?.length > 0 && { attribute }),
        ...(attribute_term?.length > 0 && { attribute_term }),
        ...(tax_class?.length > 0 && { tax_class }),
        ...(on_sale && { on_sale }),
        ...(min_price?.length > 0 && { min_price }),
        ...(max_price && { max_price }),
        ...(stock_status?.length > 0 && { stock_status }),
        ...(before?.length > 0 && { before }),
        ...(after?.length > 0 && { after }),
        ...(parent_exclude?.length > 0 && { parent_exclude }),
        ...(parent?.length > 0 && { parent }),
      };
      return await WooCommerce.get('products', searchParams)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
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
    case 'retrieve_product': {
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
  const {
    order_id,
    body,
    context,
    page,
    per_page,
    search,
    after,
    before,
    exclude,
    include,
    offset,
    order,
    orderby,
    parent,
    parent_exclude,
    status,
    customer,
    product,
    dp,
  } = queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_order': {
      const searchParams = {
        ...(context?.length > 0 && { context }),
        ...(page && { page }),
        ...(per_page && { per_page }),
        ...(search?.length > 0 && { search }),
        ...(exclude?.length > 0 && { exclude }),
        ...(include?.length > 0 && { include }),
        ...(offset && { offset }),
        ...(order && { order }),
        ...(orderby?.length > 0 && { orderby }),
        ...(status?.length > 0 && { status }),
        ...(before?.length > 0 && { before }),
        ...(after?.length > 0 && { after }),
        ...(parent_exclude?.length > 0 && { parent_exclude }),
        ...(parent?.length > 0 && { parent }),
        ...(customer?.length > 0 && { customer }),
        ...(product && { product }),
        ...(dp && { dp }),
      };
      return await WooCommerce.get('orders', searchParams)
        .then((response) => {
          returnValue = { statusCode: response.status, ...response?.data };
          return returnValue;
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
    case 'retrieve_order': {
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
  const { body, context, page, per_page, search, after, before, exclude, include, offset, order, orderby, code } =
    queryOptions;
  let returnValue = {};

  switch (operation) {
    case 'list_coupon': {
      const searchParams = {
        ...(context?.length > 0 && { context }),
        ...(page && { page }),
        ...(per_page && { per_page }),
        ...(search?.length > 0 && { search }),
        ...(exclude?.length > 0 && { exclude }),
        ...(include?.length > 0 && { include }),
        ...(offset && { offset }),
        ...(order && { order }),
        ...(orderby?.length > 0 && { orderby }),
        ...(before?.length > 0 && { before }),
        ...(after?.length > 0 && { after }),
        ...(code?.length > 0 && { code }),
      };
      return await WooCommerce.get(`coupons`, searchParams)
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
