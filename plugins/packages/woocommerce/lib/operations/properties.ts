import { body } from './definitions';

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
          value: 'retreive_customer',
          name: 'Retrieve a customer',
        },
      ],
    },
    list_customer: {},
    update_customer: {
      customer_id: {
        label: 'Customer ID',
        key: 'customer_id',
        type: 'codehinter',
        description: 'Enter customer ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
      body,
    },
    delete_customer: {
      customer_id: {
        label: 'Customer ID',
        key: 'customer_id',
        type: 'codehinter',
        description: 'Enter customer ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
    },
    batch_update_customer: {
      body,
    },
    create_customer: {
      body,
    },
    retreive_customer: {
      customer_id: {
        label: 'Customer ID',
        key: 'customer_id',
        type: 'codehinter',
        description: 'Enter customer ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
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
          value: 'retreive_product',
          name: 'Retrieve a product',
        },
      ],
    },
    list_product: {},
    update_product: {
      product_id: {
        label: 'Product ID',
        key: 'product_id',
        type: 'codehinter',
        description: 'Enter product ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
      body,
    },
    delete_product: {
      product_id: {
        label: 'Product ID',
        key: 'product_id',
        type: 'codehinter',
        description: 'Enter product ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
    },
    batch_update_product: {
      body,
    },
    create_product: {
      body,
    },
    retreive_product: {
      product_id: {
        label: 'Product ID',
        key: 'product_id',
        type: 'codehinter',
        description: 'Enter product ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
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
          value: 'retreive_order',
          name: 'Retrieve a order',
        },
      ],
    },
    list_order: {},
    update_order: {
      order_id: {
        label: 'Order ID',
        key: 'order_id',
        type: 'codehinter',
        description: 'Enter order ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
      body,
    },
    delete_order: {
      order_id: {
        label: 'Order ID',
        key: 'order_id',
        type: 'codehinter',
        description: 'Enter order ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
    },
    batch_update_order: {
      body,
    },
    create_order: {
      body,
    },
    retreive_order: {
      order_id: {
        label: 'Order ID',
        key: 'order_id',
        type: 'codehinter',
        description: 'Enter order ID',
        width: '320px',
        height: '36px',
        className: 'codehinter-plugins',
        placeholder: '',
        lineNumbers: false,
      },
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
    list_coupon: {},
    create_coupon: {
      body,
    },
  },
};
