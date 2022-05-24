import {
  body,
  customer_id,
  product_id,
  order_id,
  page,
  context,
  per_page,
  search,
  exclude,
  include,
  offset,
  order,
  orderby,
  email,
  role,
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
  customer,
  product,
  dp,
  code,
} from './definitions';

export default {
  resource: {
    label: 'Resource',
    key: 'resource',
    className: 'col-md-4',
    type: 'dropdown-component-flip',
    description: 'Resource select',
    list: [
      {
        value: 'product',
        name: 'Product',
      },
      {
        value: 'customer',
        name: 'Customer',
      },
      {
        value: 'order',
        name: 'Order',
      },
      {
        value: 'coupon',
        name: 'Coupon',
      },
    ],
  },
  customer: {
    operation: {
      label: 'Operation',
      key: 'operation',
      type: 'dropdown-component-flip',
      description: 'Single select dropdown for operation',
      list: [
        {
          value: 'list_customer',
          name: 'List all customers',
        },
        {
          value: 'update_customer',
          name: 'Update a customer',
        },
        {
          value: 'delete_customer',
          name: 'Delete a customer',
        },
        {
          value: 'batch_update_customer',
          name: 'Batch update customers',
        },
        {
          value: 'create_customer',
          name: 'Create a customer',
        },
        {
          value: 'retrieve_customer',
          name: 'Retrieve a customer',
        },
      ],
    },
    list_customer: {
      page,
      context,
      per_page,
      search,
      exclude,
      include,
      offset,
      order,
      orderby,
      email,
      role,
    },
    update_customer: {
      customer_id,
      body,
    },
    delete_customer: {
      customer_id,
    },
    batch_update_customer: {
      body,
    },
    create_customer: {
      body,
    },
    retrieve_customer: {
      customer_id,
    },
  },
  product: {
    operation: {
      label: 'Operation',
      key: 'operation',
      type: 'dropdown-component-flip',
      description: 'Single select dropdown for operation',
      list: [
        {
          value: 'list_product',
          name: 'List all products',
        },
        {
          value: 'update_product',
          name: 'Update a product',
        },
        {
          value: 'delete_product',
          name: 'Delete a product',
        },
        {
          value: 'batch_update_product',
          name: 'Batch update products',
        },
        {
          value: 'create_product',
          name: 'Create a product',
        },
        {
          value: 'retrieve_product',
          name: 'Retrieve a product',
        },
      ],
    },
    list_product: {
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
    },
    update_product: {
      product_id,
      body,
    },
    delete_product: {
      product_id,
    },
    batch_update_product: {
      body,
    },
    create_product: {
      body,
    },
    retrieve_product: {
      product_id,
    },
  },
  order: {
    operation: {
      label: 'Operation',
      key: 'operation',
      type: 'dropdown-component-flip',
      description: 'Single select dropdown for operation',
      list: [
        {
          value: 'list_order',
          name: 'List all orders',
        },
        {
          value: 'update_order',
          name: 'Update a order',
        },
        {
          value: 'delete_order',
          name: 'Delete a order',
        },
        {
          value: 'batch_update_order',
          name: 'Batch update orders',
        },
        {
          value: 'create_order',
          name: 'Create a order',
        },
        {
          value: 'retrieve_order',
          name: 'Retrieve a order',
        },
      ],
    },
    list_order: {
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
    },
    update_order: {
      order_id,
      body,
    },
    delete_order: {
      order_id,
    },
    batch_update_order: {
      body,
    },
    create_order: {
      body,
    },
    retrieve_order: {
      order_id,
    },
  },
  coupon: {
    operation: {
      label: 'Operation',
      key: 'operation',
      type: 'dropdown-component-flip',
      description: 'Single select dropdown for operation',
      list: [
        {
          value: 'list_coupon',
          name: 'List all coupons',
        },
        {
          value: 'create_coupon',
          name: 'Create a coupon',
        },
      ],
    },
    list_coupon: {
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
      code,
    },
    create_coupon: {
      body,
    },
  },
};
