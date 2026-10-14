import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import ApiContracts from 'authorizenet/lib/apicontracts';
import ApiControllers from 'authorizenet/lib/apicontrollers';
import Constants from 'authorizenet/lib/constants';


export function getEnvironment(env: string) {
  const endpoints = Constants.constants?.endpoint;
  if (!endpoints) {
    throw new Error("Authorize.net endpoints not found in Constants");
  }
  return env === "production"
    ? endpoints.production
    : endpoints.sandbox;
}

  export function getMerchantAuth(sourceOptions: SourceOptions): any {
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(sourceOptions.apiLoginId);
    merchantAuthenticationType.setTransactionKey(sourceOptions.transactionKey);
    return merchantAuthenticationType;
  }
// helpers
function parseRequestBody(queryOptions: any): any {
  try {
    return typeof queryOptions.requestBody === 'string' 
      ? JSON.parse(queryOptions.requestBody) 
      : queryOptions.requestBody;
  } catch (error) {
    throw new QueryError(
      'Request parsing failed',
      'Invalid JSON format in request body',
      {
        code: 'INVALID_JSON',
        message: error instanceof Error ? error.message : 'Failed to parse request body',
      }
    );
  }
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
function executeController<T>(ctrl: any, ResponseClass: any, errorTitle: string,timeoutMs: number = 30000 ): Promise<T> {
  return new Promise((resolve, reject) => {
    let isResolved = false;
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new QueryError(errorTitle,`Request timed out after ${timeoutMs}ms`,{code: 'TIMEOUT_ERROR',message: `Request timed out after ${timeoutMs}ms`,}));}
    }, timeoutMs);
    ctrl.execute(() => {
      clearTimeout(timeoutId);
      if (isResolved) return;
      isResolved = true;

      const apiResponse = ctrl.getResponse();
      const response = new ResponseClass(apiResponse);

      if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
        resolve(response);
      } else {
        const messages = response.getMessages()?.getMessage();
        const errorMessage = messages?.[0]?.getText() ?? 'Unknown error';
        const errorCode = messages?.[0]?.getCode() ?? 'UNKNOWN_ERROR';
        reject(new QueryError(errorTitle, errorMessage, {
          code: errorCode,
          message: errorMessage,
        }));
      }
    });
  });
}
function setProcessingOptions(transactionRequest: any, params: any): void {
  if (!params.processingOptions) return;

  const processingOptions = new ApiContracts.ProcessingOptions();
  if (params.processingOptions.isSubsequentAuth) {
    processingOptions.setIsSubsequentAuth(params.processingOptions.isSubsequentAuth);
  }
  transactionRequest.setProcessingOptions(processingOptions);
}
function setSubsequentAuthInformation(transactionRequest: any, params: any): void {
  if (!params.subsequentAuthInformation) return;

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
  transactionRequest.setSubsequentAuthInformation(subsequentAuthInfo);
}
function setAuthorizationIndicatorType(transactionRequest: any, params: any): void {
  if (!params.authorizationIndicatorType) return;

  const authIndicatorType = new ApiContracts.AuthorizationIndicatorType();
  if (params.authorizationIndicatorType.authorizationIndicator) {
    authIndicatorType.setAuthorizationIndicator(params.authorizationIndicatorType.authorizationIndicator);
  }
  transactionRequest.setAuthorizationIndicatorType(authIndicatorType);
}
function setCustomerData(transactionRequest: any, params: any): void {
  if (params.customer) {
    const customer = new ApiContracts.CustomerDataType();
    if (params.customer.id) customer.setId(params.customer.id);
    transactionRequest.setCustomer(customer);
  }

  if (params.customerIP) {
    transactionRequest.setCustomerIP(params.customerIP);
  }
}
function setUserFields(transactionRequest: any, params: any): void {
  if (!params.userFields) return;

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
    transactionRequest.setUserFields(userFieldsList);
  }
}
function setTransactionSettings(transactionRequest: any, params: any): void {
  if (!params.transactionSettings) return;

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
  transactionRequest.setTransactionSettings(settingsList);
}
function validateAmount(amount: any, operationName: string): void {
  if (!amount || amount <= 0) {
    throw new QueryError(
      `${operationName} failed`,
      'Amount must be a positive number',
      {
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than 0',
      }
    );
  }
}

//main operations
export async function chargeCreditCard(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);

  validateAmount(params.amount, 'Transaction');  

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

  setCustomerData(transactionRequestType, params);
  setTransactionSettings(transactionRequestType, params);
  setUserFields(transactionRequestType, params);
  setProcessingOptions(transactionRequestType, params);
  setSubsequentAuthInformation(transactionRequestType, params);
  setAuthorizationIndicatorType(transactionRequestType, params);

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  createRequest.setRefId(params.refId);
  
  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

  return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Transaction failed");
}

export async function authorizeCreditCard(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  validateAmount(params.amount, 'Authorization');
  const cardData = params.payment?.creditCard || params;
  const creditCard = createCreditCard(cardData);

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

  setCustomerData(transactionRequestType, params);
  setUserFields(transactionRequestType, params);
  setProcessingOptions(transactionRequestType, params);
  setSubsequentAuthInformation(transactionRequestType, params);
  setAuthorizationIndicatorType(transactionRequestType, params);

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

  return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Authorization failed");
}

export async function captureAuthorizedAmount(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  validateAmount(params.amount, 'Capture');
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

  return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Capture failed");
}

export async function refundTransaction(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);
     const params = parseRequestBody(queryOptions);
     validateAmount(params.amount, 'Refund');
     const creditCard = new ApiContracts.CreditCardType();
     creditCard.setCardNumber(params.cardNumber);  
    creditCard.setExpirationDate(params.expirationDate);   
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

    return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Refund failed");
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
  return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Void failed");
}

export async function chargeCustomerProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  validateAmount(params.amount, 'Charge customer profile');
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

  setCustomerData(transactionRequestType, params);
  setProcessingOptions(transactionRequestType, params);
  setSubsequentAuthInformation(transactionRequestType, params);
  setAuthorizationIndicatorType(transactionRequestType, params);

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequestType);
  
  if (params.refId) {
    createRequest.setRefId(params.refId);
  }

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment(sourceOptions.environment));
  return executeController(ctrl,ApiContracts.CreateTransactionResponse,"Charge customer profile failed");
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

  return executeController(ctrl,ApiContracts.CreateCustomerProfileResponse,"Create customer profile failed");
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

  return executeController(ctrl,ApiContracts.GetCustomerProfileResponse,"Get customer profile failed");
}

export async function getCustomerProfileIds(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
    const merchantAuth = getMerchantAuth(sourceOptions);

    const params = parseRequestBody(queryOptions);

    const getRequest = new ApiContracts.GetCustomerProfileIdsRequest();
    getRequest.setMerchantAuthentication(merchantAuth);

    const ctrl = new ApiControllers.GetCustomerProfileIdsController(getRequest.getJSON());
    ctrl.setEnvironment(getEnvironment(sourceOptions.environment));

    return executeController(ctrl,ApiContracts.GetCustomerProfileIdsResponse,"Get customer profile IDs failed");
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

    return executeController(ctrl,ApiContracts.UpdateCustomerProfileResponse,"Update customer profile failed");
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

    return executeController(ctrl, ApiContracts.DeleteCustomerProfileResponse,"Delete customer profile failed");
}

export async function createCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  const cardData = params.payment?.creditCard || params;
  const creditCard = createCreditCard(cardData);

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

  return executeController(ctrl, ApiContracts.CreateCustomerPaymentProfileResponse,"Create customer payment profile failed");
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

    return executeController(ctrl,ApiContracts.GetCustomerPaymentProfileResponse, "Get customer payment profile failed");
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

    return executeController(ctrl,ApiContracts.ValidateCustomerPaymentProfileResponse,"Validate customer payment profile failed");
}

export async function updateCustomerPaymentProfile(sourceOptions: SourceOptions, queryOptions: any): Promise<any> {
  const merchantAuth = getMerchantAuth(sourceOptions);
  const params = parseRequestBody(queryOptions);
  const profileData = params.paymentProfile || params;
  const cardData = profileData.payment?.creditCard || profileData;
  const creditCard = createCreditCard(cardData);
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

  return executeController(ctrl,ApiContracts.UpdateCustomerPaymentProfileResponse,"Update customer payment profile failed");
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

  return executeController(ctrl,ApiContracts.DeleteCustomerPaymentProfileResponse,"Delete customer payment profile failed");
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

  return executeController(ctrl,ApiContracts.CreateCustomerProfileResponse,"Create customer profile from transaction failed");
} 