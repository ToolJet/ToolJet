import { Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import UserResponse from './models/user_response';
import { SAML, SamlConfig } from '@node-saml/node-saml';
import { getManager } from 'typeorm';
import { extractFirstAndLastName, getServerURL } from 'src/helpers/utils.helper';
import { SSOResponse } from 'src/entities/sso_response.entity';
import got from 'got';
import { OrganizationsService } from '@services/organizations.service';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class SAMLService {
  constructor(private readonly organizationService: OrganizationsService) {}
  private _saml: SAML;

  #initSAMLSetup(configId: string, configs: any) {
    if (!configs?.idpMetadata) {
      throw new NotAcceptableException("Couldn't find idP metadata");
    }
    const { issuer, cert, entryPoint } = this.#extractMetadataValues(configs?.idpMetadata);
    const options: SamlConfig = {
      issuer,
      cert,
      entryPoint,
      callbackUrl: `${getServerURL()}/api/sso/saml/${configId}`,
      /* Some of the provider may not sign responses */
      wantAuthnResponseSigned: false,
    };
    const saml = new SAML(options);
    this._saml = saml;
  }

  async signIn(samlResponseId: string, configs: any, configId: string): Promise<UserResponse> {
    if (!this._saml) this.#initSAMLSetup(configId, configs);
    const result = await getManager().findOneOrFail(SSOResponse, samlResponseId);
    const samlResponse: any = await this.getSAMLAssert(result.response);

    const { email, name: fullName, firstName, lastName, picture: profilePhoto } = samlResponse;
    /* Default group attribute is 'groups' */
    const groups = configs?.groupAttribute
      ? samlResponse[configs?.groupAttribute]
      : samlResponse['groups']
      ? samlResponse['groups']
      : [];

    const name = extractFirstAndLastName(fullName);
    if (!(email && ((firstName && lastName) || name))) {
      /* SAML response doesn't have required attributes */
      throw new UnauthorizedException('SAML response do not have required attributes.');
    }
    const ssoResponse = {
      userSSOId: email,
      firstName: firstName || name.firstName,
      lastName: lastName || name.lastName,
      email,
      sso: 'saml',
      groups: [...(Array.isArray(groups) ? groups : groups ? [groups] : [])],
      profilePhoto,
      userinfoResponse: samlResponse,
    };
    return ssoResponse;
  }

  async getSAMLAuthorizationURL(configId: string) {
    const ssoConfigs = await this.organizationService.getConfigs(configId);
    if (!ssoConfigs) {
      throw new UnauthorizedException("Couldn't find SSO configs.");
    }

    this.#initSAMLSetup(configId, ssoConfigs.configs);
    return await this._saml.getAuthorizeUrlAsync('', '', {});
  }

  async getSAMLAssert(SAMLResponse: string) {
    const extract = await this._saml.validatePostResponseAsync({
      SAMLResponse,
    });
    const attributes = {};
    Object.keys(extract?.profile?.attributes).map((attribute) => {
      const attributeParts = attribute.split('/');
      attributes[attributeParts.length > 1 ? attributeParts[attributeParts.length - 1] : attribute] =
        extract.profile.attributes[attribute];
    });
    if (attributes['picture']) {
      const picture = attributes['picture'];
      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
      if (urlRegex.test(picture)) {
        const response = await got(picture, { responseType: 'buffer' });
        attributes['picture'] = response.body;
      }
    }
    return attributes;
  }

  async saveSAMLResponse(configId: string, response: string) {
    if (!response) {
      throw new UnauthorizedException('SAML authentication is failed. No SAML response found');
    }
    const result = await getManager().save(
      getManager().create(SSOResponse, {
        configId,
        response,
        sso: 'saml',
      })
    );
    return result.id;
  }

  #extractMetadataValues(metaData: string) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      removeNSPrefix: true,
    });
    const jObj = parser.parse(metaData);
    const cert = jObj?.EntityDescriptor?.IDPSSODescriptor?.KeyDescriptor?.KeyInfo?.X509Data?.X509Certificate;
    const entryPoint = jObj?.EntityDescriptor?.IDPSSODescriptor?.SingleSignOnService?.find(
      (item: { Binding: string; Location: string }) => {
        if (item.Binding.includes('HTTP-Redirect')) return item;
      }
    )?.Location;
    const issuer = jObj?.EntityDescriptor?.entityID;
    return {
      issuer,
      cert,
      entryPoint,
    };
  }
}
