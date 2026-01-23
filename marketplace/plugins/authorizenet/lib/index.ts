import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import ApiContracts from 'authorizenet/lib/apicontracts';
import ApiControllers from 'authorizenet/lib/apicontrollers';
import * as operations from './query_operations';

export default class Authorizenet implements QueryService {

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const merchantAuth = operations.getMerchantAuth(sourceOptions);
      const getRequest = new ApiContracts.GetMerchantDetailsRequest();
      getRequest.setMerchantAuthentication(merchantAuth);

      const ctrl = new ApiControllers.GetMerchantDetailsController(getRequest.getJSON());
      ctrl.setEnvironment(operations.getEnvironment(sourceOptions.environment));
      return new Promise((resolve, reject) => {
        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();
          const response = new ApiContracts.GetMerchantDetailsResponse(apiResponse);

          if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
            resolve({
              status: 'ok',
            });
          } else {
            const errorMessage = response.getMessages().getMessage()[0].getText();
            reject(
              new QueryError(errorMessage, errorMessage, {
                code: response.getMessages().getMessage()[0].getCode(),
                message: errorMessage,
              })
            );
          }
        });
      });
    } catch (error: any) {
      throw new QueryError('Connection test failed', error.message, {
        message: error.message,
        name: error.name,
      });
    }
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { operation } = queryOptions;

    if (!operation) {
      throw new QueryError('Invalid configuration', 'Operation is required', {
        message: 'Operation parameter is missing',
      });
    }
    try {
      let result: any;

      switch (operation) {
        case 'charge_credit_card':
             result = await operations.chargeCreditCard(sourceOptions, queryOptions);
          break;
        case 'authorize_credit_card':
             result = await operations.authorizeCreditCard(sourceOptions, queryOptions);
          break;
        case 'capture_authorized_amount':
             result = await operations.captureAuthorizedAmount(sourceOptions, queryOptions);
          break;
        case 'refund_transaction':
             result = await operations.refundTransaction(sourceOptions, queryOptions);
          break;
        case 'void_transaction':
             result = await operations.voidTransaction(sourceOptions, queryOptions);
          break;
        case 'charge_customer_profile':
             result = await operations.chargeCustomerProfile(sourceOptions, queryOptions);
          break;
        case 'create_customer_pofile':
             result = await operations.createCustomerProfile(sourceOptions,queryOptions);
          break;
        case 'get_customer_profile':
              result = await operations.getCustomerProfile(sourceOptions,queryOptions);
          break;
        case 'get_customer_profileIds':
              result = await operations.getCustomerProfileIds(sourceOptions,queryOptions);
          break;
        case 'update_customer_profile':
              result = await operations.updateCustomerProfile(sourceOptions,queryOptions);
          break;
        case 'delete_customer_profile':
              result = await operations.deleteCustomerProfile(sourceOptions,queryOptions);
          break;
        case 'create_customer_payment_profile':
              result = await operations.createCustomerPaymentProfile(sourceOptions,queryOptions);
          break;
        case 'get_customer_payment_profile':
              result = await operations.getCustomerPaymentProfile(sourceOptions,queryOptions);
          break;
        case 'validate_customer_payment_profile':
              result = await operations.validateCustomerPaymentProfile(sourceOptions,queryOptions);
          break;
        case 'update_customer_payment_profile':
              result = await operations.updateCustomerPaymentProfile(sourceOptions,queryOptions);
          break;
        case 'delete_customer_payment_profile':
              result = await operations.deleteCustomerPaymentProfile(sourceOptions,queryOptions);
          break;
        case 'create_customer_profile_from_transaction':
              result = await operations.createCustomerProfileFromTransaction(sourceOptions,queryOptions);
          break;
        default:
          throw new QueryError('Invalid operation', `Operation '${operation}' is not supported`, {
            operation,
          });
      }

      return {
        status: 'ok',
        data: result,
      };
    } catch (error: any) {
      throw new QueryError('Operation failed', error.data.message, {
        name : error.name,
        code : error.data.code,
        message : error.data.message
      });
    }
  }
}
