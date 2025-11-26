import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import ApiContracts from 'authorizenet/lib/apicontracts';
import ApiControllers from 'authorizenet/lib/apicontrollers';
import Constants from 'authorizenet/lib/constants';

export default class Authorizenet implements QueryService {
  private getEnvironment(env: string): any {
    return env === 'production' ? Constants.endpoint.production : Constants.endpoint.sandbox;
  }

  private getMerchantAuth(sourceOptions: SourceOptions): any {
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(sourceOptions.apiLoginId);
    merchantAuthenticationType.setTransactionKey(sourceOptions.transactionKey);
    return merchantAuthenticationType;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const merchantAuth = this.getMerchantAuth(sourceOptions);
      const getRequest = new ApiContracts.GetMerchantDetailsRequest();
      getRequest.setMerchantAuthentication(merchantAuth);

      const ctrl = new ApiControllers.GetMerchantDetailsController(getRequest.getJSON());
      ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

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
              new QueryError('Connection test failed', errorMessage, {
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
    const { operation, requestBody } = queryOptions;

    if (!operation) {
      throw new QueryError('Invalid configuration', 'Operation is required', {
        message: 'Operation parameter is missing',
      });
    }

    let parsedRequestBody: any = {};
    if (requestBody) {
      try {
        parsedRequestBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
      } catch (error: any) {
        throw new QueryError('Invalid request body', 'Request body must be valid JSON', {
          message: error.message,
        });
      }
    }

    try {
      let result: any;

      switch (operation) {
        case 'chargeCreditCard':
          result = await this.chargeCreditCard(sourceOptions, parsedRequestBody);
          break;
        case 'authorizeCreditCard':
          result = await this.authorizeCreditCard(sourceOptions, parsedRequestBody);
          break;
        case 'captureAuthorizedAmount':
          result = await this.captureAuthorizedAmount(sourceOptions, parsedRequestBody);
          break;
        case 'refundTransaction':
          result = await this.refundTransaction(sourceOptions, parsedRequestBody);
          break;
        case 'voidTransaction':
          result = await this.voidTransaction(sourceOptions, parsedRequestBody);
          break;
        case 'chargeCustomerProfile':
          result = await this.chargeCustomerProfile(sourceOptions, parsedRequestBody);
          break;
        case 'createCustomerProfile':
          result = await this.createCustomerProfile(sourceOptions, parsedRequestBody);
          break;
        case 'getCustomerProfile':
          result = await this.getCustomerProfile(sourceOptions, parsedRequestBody);
          break;
        case 'getCustomerProfileIds':
          result = await this.getCustomerProfileIds(sourceOptions, parsedRequestBody);
          break;
        case 'updateCustomerProfile':
          result = await this.updateCustomerProfile(sourceOptions, parsedRequestBody);
          break;
        case 'deleteCustomerProfile':
          result = await this.deleteCustomerProfile(sourceOptions, parsedRequestBody);
          break;
        case 'createCustomerPaymentProfile':
          result = await this.createCustomerPaymentProfile(sourceOptions, parsedRequestBody);
          break;
        case 'getCustomerPaymentProfile':
          result = await this.getCustomerPaymentProfile(sourceOptions, parsedRequestBody);
          break;
        case 'validateCustomerPaymentProfile':
          result = await this.validateCustomerPaymentProfile(sourceOptions, parsedRequestBody);
          break;
        case 'updateCustomerPaymentProfile':
          result = await this.updateCustomerPaymentProfile(sourceOptions, parsedRequestBody);
          break;
        case 'deleteCustomerPaymentProfile':
          result = await this.deleteCustomerPaymentProfile(sourceOptions, parsedRequestBody);
          break;
        case 'createCustomerProfileFromTransaction':
          result = await this.createCustomerProfileFromTransaction(sourceOptions, parsedRequestBody);
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
      throw new QueryError('Operation failed', error.message, {
        message: error.message,
        name: error.name,
        operation,
      });
    }
  }

  private async chargeCreditCard(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(params.cardNumber);
    creditCard.setExpirationDate(params.expirationDate);
    if (params.cardCode) {
      creditCard.setCardCode(params.cardCode);
    }

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(params.amount);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Transaction failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async authorizeCreditCard(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(params.cardNumber);
    creditCard.setExpirationDate(params.expirationDate);
    if (params.cardCode) {
      creditCard.setCardCode(params.cardCode);
    }

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHONLYTRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(params.amount);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Authorization failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async captureAuthorizedAmount(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION);
    transactionRequestType.setAmount(params.amount);
    transactionRequestType.setRefTransId(params.transactionId);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Capture failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async refundTransaction(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(params.cardNumber);
    creditCard.setExpirationDate('XXXX');

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION);
    transactionRequestType.setAmount(params.amount);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setRefTransId(params.transactionId);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Refund failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async voidTransaction(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.VOIDTRANSACTION);
    transactionRequestType.setRefTransId(params.transactionId);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Void failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async chargeCustomerProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const profileToCharge = new ApiContracts.CustomerProfilePaymentType();
    profileToCharge.setCustomerProfileId(params.customerProfileId);

    const paymentProfile = new ApiContracts.PaymentProfile();
    paymentProfile.setPaymentProfileId(params.customerPaymentProfileId);
    profileToCharge.setPaymentProfile(paymentProfile);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setProfile(profileToCharge);
    transactionRequestType.setAmount(params.amount);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Charge customer profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async createCustomerProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const customerProfile = new ApiContracts.CustomerProfileType();
    if (params.merchantCustomerId) {
      customerProfile.setMerchantCustomerId(params.merchantCustomerId);
    }
    if (params.description) {
      customerProfile.setDescription(params.description);
    }
    if (params.email) {
      customerProfile.setEmail(params.email);
    }

    const createRequest = new ApiContracts.CreateCustomerProfileRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setProfile(customerProfile);

    const ctrl = new ApiControllers.CreateCustomerProfileController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateCustomerProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Create customer profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async getCustomerProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const getRequest = new ApiContracts.GetCustomerProfileRequest();
    getRequest.setMerchantAuthentication(merchantAuth);
    getRequest.setCustomerProfileId(params.customerProfileId);

    const ctrl = new ApiControllers.GetCustomerProfileController(getRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.GetCustomerProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Get customer profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async getCustomerProfileIds(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const getRequest = new ApiContracts.GetCustomerProfileIdsRequest();
    getRequest.setMerchantAuthentication(merchantAuth);

    const ctrl = new ApiControllers.GetCustomerProfileIdsController(getRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.GetCustomerProfileIdsResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Get customer profile IDs failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async updateCustomerProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const customerProfile = new ApiContracts.CustomerProfileExType();
    customerProfile.setCustomerProfileId(params.customerProfileId);
    if (params.merchantCustomerId) {
      customerProfile.setMerchantCustomerId(params.merchantCustomerId);
    }
    if (params.description) {
      customerProfile.setDescription(params.description);
    }
    if (params.email) {
      customerProfile.setEmail(params.email);
    }

    const updateRequest = new ApiContracts.UpdateCustomerProfileRequest();
    updateRequest.setMerchantAuthentication(merchantAuth);
    updateRequest.setProfile(customerProfile);

    const ctrl = new ApiControllers.UpdateCustomerProfileController(updateRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.UpdateCustomerProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Update customer profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async deleteCustomerProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const deleteRequest = new ApiContracts.DeleteCustomerProfileRequest();
    deleteRequest.setMerchantAuthentication(merchantAuth);
    deleteRequest.setCustomerProfileId(params.customerProfileId);

    const ctrl = new ApiControllers.DeleteCustomerProfileController(deleteRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.DeleteCustomerProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Delete customer profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async createCustomerPaymentProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(params.cardNumber);
    creditCard.setExpirationDate(params.expirationDate);
    if (params.cardCode) {
      creditCard.setCardCode(params.cardCode);
    }

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const customerPaymentProfile = new ApiContracts.CustomerPaymentProfileType();
    customerPaymentProfile.setPayment(paymentType);

    const createRequest = new ApiContracts.CreateCustomerPaymentProfileRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setCustomerProfileId(params.customerProfileId);
    createRequest.setPaymentProfile(customerPaymentProfile);

    const ctrl = new ApiControllers.CreateCustomerPaymentProfileController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateCustomerPaymentProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Create customer payment profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async getCustomerPaymentProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const getRequest = new ApiContracts.GetCustomerPaymentProfileRequest();
    getRequest.setMerchantAuthentication(merchantAuth);
    getRequest.setCustomerProfileId(params.customerProfileId);
    getRequest.setCustomerPaymentProfileId(params.customerPaymentProfileId);

    const ctrl = new ApiControllers.GetCustomerPaymentProfileController(getRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.GetCustomerPaymentProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Get customer payment profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async validateCustomerPaymentProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const validateRequest = new ApiContracts.ValidateCustomerPaymentProfileRequest();
    validateRequest.setMerchantAuthentication(merchantAuth);
    validateRequest.setCustomerProfileId(params.customerProfileId);
    validateRequest.setCustomerPaymentProfileId(params.customerPaymentProfileId);
    validateRequest.setValidationMode(
      params.validationMode === 'liveMode'
        ? ApiContracts.ValidationModeEnum.LIVEMODE
        : ApiContracts.ValidationModeEnum.TESTMODE
    );

    const ctrl = new ApiControllers.ValidateCustomerPaymentProfileController(validateRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.ValidateCustomerPaymentProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Validate customer payment profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async updateCustomerPaymentProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(params.cardNumber);
    creditCard.setExpirationDate(params.expirationDate);
    if (params.cardCode) {
      creditCard.setCardCode(params.cardCode);
    }

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const customerPaymentProfile = new ApiContracts.CustomerPaymentProfileExType();
    customerPaymentProfile.setPayment(paymentType);
    customerPaymentProfile.setCustomerPaymentProfileId(params.customerPaymentProfileId);

    const updateRequest = new ApiContracts.UpdateCustomerPaymentProfileRequest();
    updateRequest.setMerchantAuthentication(merchantAuth);
    updateRequest.setCustomerProfileId(params.customerProfileId);
    updateRequest.setPaymentProfile(customerPaymentProfile);

    const ctrl = new ApiControllers.UpdateCustomerPaymentProfileController(updateRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.UpdateCustomerPaymentProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Update customer payment profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async deleteCustomerPaymentProfile(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const deleteRequest = new ApiContracts.DeleteCustomerPaymentProfileRequest();
    deleteRequest.setMerchantAuthentication(merchantAuth);
    deleteRequest.setCustomerProfileId(params.customerProfileId);
    deleteRequest.setCustomerPaymentProfileId(params.customerPaymentProfileId);

    const ctrl = new ApiControllers.DeleteCustomerPaymentProfileController(deleteRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.DeleteCustomerPaymentProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Delete customer payment profile failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }

  private async createCustomerProfileFromTransaction(sourceOptions: SourceOptions, params: any): Promise<any> {
    const merchantAuth = this.getMerchantAuth(sourceOptions);

    const createRequest = new ApiContracts.CreateCustomerProfileFromTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransId(params.transactionId);

    const ctrl = new ApiControllers.CreateCustomerProfileFromTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(this.getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateCustomerProfileResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Create customer profile from transaction failed', errorMessage, {
              code: response.getMessages().getMessage()[0].getCode(),
              message: errorMessage,
            })
          );
        }
      });
    });
  }
}
