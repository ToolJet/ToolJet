import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import ApiContracts from 'authorizenet/lib/apicontracts';
import ApiControllers from 'authorizenet/lib/apicontrollers';
import Constants from 'authorizenet/lib/constants';


  export function getEnvironment(env: string): any {
      return env === 'production' ? "https://api.authorize.net/xml/v1/request.api" : "https://apitest.authorize.net/xml/v1/request.api";
  }

  export function getMerchantAuth(sourceOptions: SourceOptions): any {
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(sourceOptions.apiLoginId);
    merchantAuthenticationType.setTransactionKey(sourceOptions.transactionKey);
    return merchantAuthenticationType;
  }

function parseRequestBody(queryOptions: any): any {
  return typeof queryOptions.requestBody === 'string' 
    ? JSON.parse(queryOptions.requestBody) 
    : queryOptions.requestBody;
}
function createCustomerAddress(addressData: any): any {
  if (!addressData) return null;

  const address = new ApiContracts.CustomerAddressType();
  
  if (addressData.firstName) address.setFirstName(addressData.firstName);
  if (addressData.lastName) address.setLastName(addressData.lastName);
  if (addressData.company) address.setCompany(addressData.company);
  if (addressData.address) address.setAddress(addressData.address);
  if (addressData.city) address.setCity(addressData.city);
  if (addressData.state) address.setState(addressData.state);
  if (addressData.zip) address.setZip(addressData.zip);
  if (addressData.country) address.setCountry(addressData.country);
  if (addressData.phoneNumber) address.setPhoneNumber(addressData.phoneNumber);
  if (addressData.faxNumber) address.setFaxNumber(addressData.faxNumber);
  
  return address;
}
function createExtendedAmountType(data: any): any {
  if (!data) return null;

  const extendedAmount = new ApiContracts.ExtendedAmountType();
  
  if (data.amount) extendedAmount.setAmount(data.amount);
  if (data.name) extendedAmount.setName(data.name);
  if (data.description) extendedAmount.setDescription(data.description);
  
  return extendedAmount;
}
function setLineItemsIfExists(transactionRequest: any, lineItemsData: any): void {
  if (!lineItemsData) return;

  const lineItemsArray = Array.isArray(lineItemsData.lineItem) 
    ? lineItemsData.lineItem 
    : [lineItemsData.lineItem];
  
  const lineItems = [];
  lineItemsArray.forEach(item => {
    if (item) {
      const lineItem = new ApiContracts.LineItemType();
      if (item.itemId) lineItem.setItemId(item.itemId);
      if (item.name) lineItem.setName(item.name);
      if (item.description) lineItem.setDescription(item.description);
      if (item.quantity) lineItem.setQuantity(item.quantity);
      if (item.unitPrice) lineItem.setUnitPrice(item.unitPrice);
      lineItems.push(lineItem);
    }
  });
  
  if (lineItems.length > 0) {
    const lineItemsList = new ApiContracts.ArrayOfLineItem();
    lineItemsList.setLineItem(lineItems);
    transactionRequest.setLineItems(lineItemsList);
  }
}
function setTransactionAmounts(transactionRequest: any, params: any): void {
  const tax = createExtendedAmountType(params.tax);
  if (tax) {
    transactionRequest.setTax(tax);
  }

  const duty = createExtendedAmountType(params.duty);
  if (duty) {
    transactionRequest.setDuty(duty);
  }

  const shipping = createExtendedAmountType(params.shipping);
  if (shipping) {
    transactionRequest.setShipping(shipping);
  }
}
function setTransactionAddresses(transactionRequest: any, params: any): void {
  const billTo = createCustomerAddress(params.billTo);
  if (billTo) {
    transactionRequest.setBillTo(billTo);
  }

  const shipTo = createCustomerAddress(params.shipTo);
  if (shipTo) {
    transactionRequest.setShipTo(shipTo);
  }
}
function createCreditCard(cardData: any): any {
  if (!cardData) return null;

  const creditCard = new ApiContracts.CreditCardType();
  creditCard.setCardNumber(cardData.cardNumber);
  creditCard.setExpirationDate(cardData.expirationDate);
  if (cardData.cardCode) {
    creditCard.setCardCode(cardData.cardCode);
  }
  
  return creditCard;
}
export async function chargeCreditCard(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  const creditCard = createCreditCard(params);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setAmount(params.amount);

  setLineItemsIfExists(transactionRequestType, params.lineItems);
  setTransactionAmounts(transactionRequestType, params);
  setTransactionAddresses(transactionRequestType, params);

  if (params.poNumber) {
    transactionRequestType.setPoNumber(params.poNumber);
  }

  if (params.customer) {
    const customer = new ApiContracts.CustomerDataType();
    if (params.customer.id) customer.setId(params.customer.id);
    transactionRequestType.setCustomer(customer);
  }

  if (params.customerIP) {
    transactionRequestType.setCustomerIP(params.customerIP);
  }

  if (params.transactionSettings) {
    const settingsList = new ApiContracts.ArrayOfSetting();
    const settingsArray = Array.isArray(params.transactionSettings.setting)
      ? params.transactionSettings.setting
      : [params.transactionSettings.setting];
    
    settingsArray.forEach(s => {
      const setting = new ApiContracts.SettingType();
      if (s.settingName) setting.setSettingName(s.settingName);
      if (s.settingValue) setting.setSettingValue(s.settingValue);
      settingsList.getSetting().push(setting);
    });
    transactionRequestType.setTransactionSettings(settingsList);
  }

  if (params.userFields) {
    const userFieldsList = new ApiContracts.TransactionRequestType.UserFields();
    const userFieldsArray = Array.isArray(params.userFields.userField)
      ? params.userFields.userField
      : [params.userFields.userField];
    
    userFieldsArray.forEach(uf => {
      const userField = new ApiContracts.UserField();
      if (uf.name) userField.setName(uf.name);
      if (uf.value) userField.setValue(uf.value);
      userFieldsList.getUserField().push(userField);
    });
    transactionRequestType.setUserFields(userFieldsList);
  }

  if (params.processingOptions) {
    const processingOptions = new ApiContracts.ProcessingOptions();
    if (params.processingOptions.isSubsequentAuth) {
      processingOptions.setIsSubsequentAuth(params.processingOptions.isSubsequentAuth);
    }
    transactionRequestType.setProcessingOptions(processingOptions);
  }

  if (params.subsequentAuthInformation) {
    const subsequentAuthInfo = new ApiContracts.SubsequentAuthInformation();
    if (params.subsequentAuthInformation.originalNetworkTransId) {
      subsequentAuthInfo.setOriginalNetworkTransId(params.subsequentAuthInformation.originalNetworkTransId);
    }
    if (params.subsequentAuthInformation.originalAuthAmount) {
      subsequentAuthInfo.setOriginalAuthAmount(params.subsequentAuthInformation.originalAuthAmount);
    }
    if (params.subsequentAuthInformation.reason) {
      subsequentAuthInfo.setReason(params.subsequentAuthInformation.reason);
    }
    transactionRequestType.setSubsequentAuthInformation(subsequentAuthInfo);
  }

  if (params.authorizationIndicatorType) {
    const authIndicatorType = new ApiContracts.AuthorizationIndicatorType();
    if (params.authorizationIndicatorType.authorizationIndicator) {
      authIndicatorType.setAuthorizationIndicator(params.authorizationIndicatorType.authorizationIndicator);
    }
    transactionRequestType.setAuthorizationIndicatorType(authIndicatorType);
  }

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  createRequest.setRefId(params.refId);
  
  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function authorizeCreditCard(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  const cardData = params.payment?.creditCard || params;
  const creditCard = createCreditCard(params);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHONLYTRANSACTION);
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setAmount(params.amount);

  setLineItemsIfExists(transactionRequestType, params.lineItems);
  setTransactionAmounts(transactionRequestType, params);
  setTransactionAddresses(transactionRequestType, params);

  if (params.poNumber) {
    transactionRequestType.setPoNumber(params.poNumber);
  }

  if (params.customer) {
    const customer = new ApiContracts.CustomerDataType();
    if (params.customer.id) customer.setId(params.customer.id);
    transactionRequestType.setCustomer(customer);
  }

  if (params.customerIP) {
    transactionRequestType.setCustomerIP(params.customerIP);
  }

  if (params.userFields) {
    const userFieldsArray = Array.isArray(params.userFields.userField)
      ? params.userFields.userField
      : [params.userFields.userField];
    
    const userFields = [];
    userFieldsArray.forEach(uf => {
      if (uf) {
        const userField = new ApiContracts.UserField();
        if (uf.name) userField.setName(uf.name);
        if (uf.value) userField.setValue(uf.value);
        userFields.push(userField);
      }
    });
    
    if (userFields.length > 0) {
      const userFieldsList = new ApiContracts.TransactionRequestType.UserFields();
      userFieldsList.setUserField(userFields);
      transactionRequestType.setUserFields(userFieldsList);
    }
  }

  if (params.processingOptions) {
    const processingOptions = new ApiContracts.ProcessingOptions();
    if (params.processingOptions.isSubsequentAuth) {
      processingOptions.setIsSubsequentAuth(params.processingOptions.isSubsequentAuth);
    }
    transactionRequestType.setProcessingOptions(processingOptions);
  }

  if (params.subsequentAuthInformation) {
    const subsequentAuthInfo = new ApiContracts.SubsequentAuthInformation();
    if (params.subsequentAuthInformation.originalNetworkTransId) {
      subsequentAuthInfo.setOriginalNetworkTransId(params.subsequentAuthInformation.originalNetworkTransId);
    }
    if (params.subsequentAuthInformation.originalAuthAmount) {
      subsequentAuthInfo.setOriginalAuthAmount(params.subsequentAuthInformation.originalAuthAmount);
    }
    if (params.subsequentAuthInformation.reason) {
      subsequentAuthInfo.setReason(params.subsequentAuthInformation.reason);
    }
    transactionRequestType.setSubsequentAuthInformation(subsequentAuthInfo);
  }

  if (params.authorizationIndicatorType) {
    const authIndicatorType = new ApiContracts.AuthorizationIndicatorType();
    if (params.authorizationIndicatorType.authorizationIndicator) {
      authIndicatorType.setAuthorizationIndicator(params.authorizationIndicatorType.authorizationIndicator);
    }
    transactionRequestType.setAuthorizationIndicatorType(authIndicatorType);
  }

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function captureAuthorizedAmount(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION);
  transactionRequestType.setAmount(params.amount);
  transactionRequestType.setRefTransId(params.refTransId);

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function refundTransaction(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);
     const params = parseRequestBody(queryOptions);
    const creditCard = createCreditCard(params);

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION);
    transactionRequestType.setAmount(params.amount);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setRefTransId(params.transId);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);
        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response);
        } else {
          const errorMessage = response.getMessages().getMessage()[0].getText();
          reject(
            new QueryError('Refund failed', errorMessage, response)
          );
        }
      });
    });
}
export async function voidTransaction(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);

  const params = parseRequestBody(queryOptions);

  if (!params.transId) {
    throw new QueryError(
      'Void failed',
      'Missing required parameter: transId',
      {
        code: 'MISSING_PARAM',
        message: 'transId is required for void transaction',
      }
    );
  }

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.VOIDTRANSACTION);
  transactionRequestType.setRefTransId(params.transId);
  
  if (params.terminalNumber) {
    transactionRequestType.setTerminalNumber(params.terminalNumber);
  }

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  
  if (params.refId) {
    const refId = params.refId.toString().substring(0, 20);
    createRequest.setRefId(refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

  return new Promise((resolve, reject) => {
    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const response = new ApiContracts.CreateTransactionResponse(apiResponse);
      
      if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
        resolve(response);
      } else {
        const messages = response.getMessages().getMessage();
        const errorMessage = messages[0].getText();
        const errorCode = messages[0].getCode();
        
        reject(
          new QueryError('Void failed', errorMessage, {
            code: errorCode,
            message: errorMessage,
          })
        );
      }
    });
  });
}
export async function chargeCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  const profileData = params.profile || params;

  const profileToCharge = new ApiContracts.CustomerProfilePaymentType();
  profileToCharge.setCustomerProfileId(
    profileData.customerProfileId || params.customerProfileId
  );

  const paymentProfile = new ApiContracts.PaymentProfile();
  paymentProfile.setPaymentProfileId(
    profileData.paymentProfile?.paymentProfileId || params.customerPaymentProfileId
  );
  profileToCharge.setPaymentProfile(paymentProfile);

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequestType.setProfile(profileToCharge);
  transactionRequestType.setAmount(params.amount);

  setLineItemsIfExists(transactionRequestType, params.lineItems);
  setTransactionAmounts(transactionRequestType, params);
  setTransactionAddresses(transactionRequestType, params);

  if (params.poNumber) {
    transactionRequestType.setPoNumber(params.poNumber);
  }

  if (params.customer) {
    const customer = new ApiContracts.CustomerDataType();
    if (params.customer.id) customer.setId(params.customer.id);
    transactionRequestType.setCustomer(customer);
  }

  if (params.customerIP) {
    transactionRequestType.setCustomerIP(params.customerIP);
  }

  if (params.processingOptions) {
    const processingOptions = new ApiContracts.ProcessingOptions();
    if (params.processingOptions.isSubsequentAuth) {
      processingOptions.setIsSubsequentAuth(params.processingOptions.isSubsequentAuth);
    }
    transactionRequestType.setProcessingOptions(processingOptions);
  }

  if (params.subsequentAuthInformation) {
    const subsequentAuthInfo = new ApiContracts.SubsequentAuthInformation();
    if (params.subsequentAuthInformation.originalNetworkTransId) {
      subsequentAuthInfo.setOriginalNetworkTransId(params.subsequentAuthInformation.originalNetworkTransId);
    }
    if (params.subsequentAuthInformation.originalAuthAmount) {
      subsequentAuthInfo.setOriginalAuthAmount(params.subsequentAuthInformation.originalAuthAmount);
    }
    if (params.subsequentAuthInformation.reason) {
      subsequentAuthInfo.setReason(params.subsequentAuthInformation.reason);
    }
    transactionRequestType.setSubsequentAuthInformation(subsequentAuthInfo);
  }

  if (params.authorizationIndicatorType) {
    const authIndicatorType = new ApiContracts.AuthorizationIndicatorType();
    if (params.authorizationIndicatorType.authorizationIndicator) {
      authIndicatorType.setAuthorizationIndicator(params.authorizationIndicatorType.authorizationIndicator);
    }
    transactionRequestType.setAuthorizationIndicatorType(authIndicatorType);
  }

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  
  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function createCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

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

  if (params.profileType) {
    customerProfile.setProfileType(params.profileType);
  }

  if (params.paymentProfiles && Array.isArray(params.paymentProfiles)) {
    const paymentProfilesList = params.paymentProfiles.map((profile: any) => {
      const paymentProfile = new ApiContracts.CustomerPaymentProfileType();

      if (profile.customerType) {
        paymentProfile.setCustomerType(profile.customerType);
      }

      const billTo = createCustomerAddress(profile.billTo);
      if (billTo) {
        paymentProfile.setBillTo(billTo);
      }

      if (profile.payment) {
        const payment = new ApiContracts.PaymentType();

        if (profile.payment.creditCard) {
           const creditCard = createCreditCard(profile.payment.creditCard);
            payment.setCreditCard(creditCard);
        }

        if (profile.payment.bankAccount) {
          const bankAccount = new ApiContracts.BankAccountType();
          bankAccount.setAccountType(profile.payment.bankAccount.accountType);
          bankAccount.setRoutingNumber(profile.payment.bankAccount.routingNumber);
          bankAccount.setAccountNumber(profile.payment.bankAccount.accountNumber);
          bankAccount.setNameOnAccount(profile.payment.bankAccount.nameOnAccount);
          if (profile.payment.bankAccount.echeckType) {
            bankAccount.setEcheckType(profile.payment.bankAccount.echeckType);
          }
          if (profile.payment.bankAccount.bankName) {
            bankAccount.setBankName(profile.payment.bankAccount.bankName);
          }
          payment.setBankAccount(bankAccount);
        }

        if (profile.payment.opaqueData) {
          const opaqueData = new ApiContracts.OpaqueDataType();
          opaqueData.setDataDescriptor(profile.payment.opaqueData.dataDescriptor);
          opaqueData.setDataValue(profile.payment.opaqueData.dataValue);
          payment.setOpaqueData(opaqueData);
        }

        paymentProfile.setPayment(payment);
      }

      return paymentProfile;
    });

    customerProfile.setPaymentProfiles(paymentProfilesList);
  }

  if (params.shipToList && Array.isArray(params.shipToList)) {
    const shipToList = params.shipToList.map((address: any) => createCustomerAddress(address));
    customerProfile.setShipToList(shipToList);
  }

  const createRequest = new ApiContracts.CreateCustomerProfileRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setProfile(customerProfile);

  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  if (params.validationMode) {
    createRequest.setValidationMode(params.validationMode);
  }

  const ctrl = new ApiControllers.CreateCustomerProfileController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function getCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);

  const params = parseRequestBody(queryOptions);

  const getRequest = new ApiContracts.GetCustomerProfileRequest();
  getRequest.setMerchantAuthentication(merchantAuth);
  getRequest.setCustomerProfileId(params.customerProfileId);

  if (params.refId !== undefined && params.refId !== null) {
    getRequest.setRefId(params.refId);
  }

  if (params.merchantCustomerId !== undefined && params.merchantCustomerId !== null) {
    getRequest.setMerchantCustomerId(params.merchantCustomerId);
  }

  if (params.email !== undefined && params.email !== null) {
    getRequest.setEmail(params.email);
  }

  if (params.unmaskExpirationDate !== undefined) {
    getRequest.setUnmaskExpirationDate(
      params.unmaskExpirationDate === true || params.unmaskExpirationDate === "true"
    );
  }

  if (params.includeIssuerInfo !== undefined) {
    getRequest.setIncludeIssuerInfo(
      params.includeIssuerInfo === true || params.includeIssuerInfo === "true"
    );
  }

  const ctrl = new ApiControllers.GetCustomerProfileController(getRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function getCustomerProfileIds(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);

    const params = parseRequestBody(queryOptions);

    const getRequest = new ApiContracts.GetCustomerProfileIdsRequest();
    getRequest.setMerchantAuthentication(merchantAuth);

    const ctrl = new ApiControllers.GetCustomerProfileIdsController(getRequest.getJSON());
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function updateCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);
    const params = parseRequestBody(queryOptions);

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
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function deleteCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);

   const params = parseRequestBody(queryOptions);

    const deleteRequest = new ApiContracts.DeleteCustomerProfileRequest();
    deleteRequest.setMerchantAuthentication(merchantAuth);
    deleteRequest.setCustomerProfileId(params.customerProfileId);
    if (params.refId) {
    deleteRequest.setRefId(params.refId);
  }

    const ctrl = new ApiControllers.DeleteCustomerProfileController(deleteRequest.getJSON());
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function createCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  const cardData = params.payment?.creditCard || params;
  const creditCard = createCreditCard(params);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const customerPaymentProfile = new ApiContracts.CustomerPaymentProfileType();
  customerPaymentProfile.setPayment(paymentType);

  const billTo = createCustomerAddress(params.billTo);
  if (billTo) {
    customerPaymentProfile.setBillTo(billTo);
  }

  if (params.defaultPaymentProfile !== undefined) {
    customerPaymentProfile.setDefaultPaymentProfile(params.defaultPaymentProfile);
  }

  const createRequest = new ApiContracts.CreateCustomerPaymentProfileRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setCustomerProfileId(params.customerProfileId);
  createRequest.setPaymentProfile(customerPaymentProfile);

  if (params.validationMode) {
    createRequest.setValidationMode(params.validationMode);
  }

  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateCustomerPaymentProfileController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function getCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);
    const params = parseRequestBody(queryOptions);

    const getRequest = new ApiContracts.GetCustomerPaymentProfileRequest();
    getRequest.setMerchantAuthentication(merchantAuth);
    getRequest.setCustomerProfileId(params.customerProfileId);
    getRequest.setCustomerPaymentProfileId(params.customerPaymentProfileId);

    const ctrl = new ApiControllers.GetCustomerPaymentProfileController(getRequest.getJSON());
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function validateCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);

    const params = parseRequestBody(queryOptions);

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
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function updateCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  const profileData = params.paymentProfile || params;
  const cardData = profileData.payment?.creditCard || params;

  const creditCard = new ApiContracts.CreditCardType();
  creditCard.setCardNumber(cardData.cardNumber);
  creditCard.setExpirationDate(cardData.expirationDate);
  if (cardData.cardCode) {
    creditCard.setCardCode(cardData.cardCode);
  }

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const customerPaymentProfile = new ApiContracts.CustomerPaymentProfileExType();
  customerPaymentProfile.setPayment(paymentType);
  customerPaymentProfile.setCustomerPaymentProfileId(
    profileData.customerPaymentProfileId || params.customerPaymentProfileId
  );

  const billTo = createCustomerAddress(profileData.billTo);
  if (billTo) {
    customerPaymentProfile.setBillTo(billTo);
  }

  if (profileData.defaultPaymentProfile !== undefined) {
    customerPaymentProfile.setDefaultPaymentProfile(profileData.defaultPaymentProfile);
  }

  const updateRequest = new ApiContracts.UpdateCustomerPaymentProfileRequest();
  updateRequest.setMerchantAuthentication(merchantAuth);
  updateRequest.setCustomerProfileId(params.customerProfileId);
  updateRequest.setPaymentProfile(customerPaymentProfile);

  if (params.validationMode) {
    updateRequest.setValidationMode(params.validationMode);
  }

  if (params.refId) {
    updateRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.UpdateCustomerPaymentProfileController(updateRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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
export async function deleteCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);

  const params = parseRequestBody(queryOptions);

  const deleteRequest = new ApiContracts.DeleteCustomerPaymentProfileRequest();
  deleteRequest.setMerchantAuthentication(merchantAuth);
  deleteRequest.setCustomerProfileId(params.customerProfileId);
  deleteRequest.setCustomerPaymentProfileId(params.customerPaymentProfileId);
  
  if (params.refId) {
    deleteRequest.setRefId(params.refId);
  }
  const ctrl = new ApiControllers.DeleteCustomerPaymentProfileController(deleteRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));
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
export async function createCustomerProfileFromTransaction(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);

 const params = parseRequestBody(queryOptions);

  const createRequest = new ApiContracts.CreateCustomerProfileFromTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransId(params.transId);

  if (params.customer) {
    const customer = new ApiContracts.CustomerProfileBaseType();
    if (params.customer.merchantCustomerId) {
      customer.setMerchantCustomerId(params.customer.merchantCustomerId);
    }
    if (params.customer.description) {
      customer.setDescription(params.customer.description);
    }
    if (params.customer.email) {
      customer.setEmail(params.customer.email);
    }
    createRequest.setCustomer(customer);
  }

  if (params.profileType) {
    createRequest.setProfileType(params.profileType);
  }

  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateCustomerProfileFromTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

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