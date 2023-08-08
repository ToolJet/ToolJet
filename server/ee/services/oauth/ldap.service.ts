import { Injectable, UnauthorizedException } from '@nestjs/common';
import UserResponse from './models/user_response';
import { SearchOptions, createClient, Client } from 'ldapjs';
import { TlsOptions } from 'tls';

@Injectable()
export class LdapService {
  constructor() {}

  async signIn(body: any, ssoConfigs: any): Promise<UserResponse> {
    const { username, password } = body;

    if (!ssoConfigs) {
      throw new UnauthorizedException();
    }

    // LDAP server configuration
    const client = await this.initializeLdapClient(ssoConfigs);
    const { basedn } = ssoConfigs;
    const bindDn = `cn=${username},${basedn}`;

    return new Promise((resolve, reject) => {
      // Perform the sign-in (bind) operation
      client.bind(bindDn, password, (err) => {
        if (err) {
          console.error('LDAP bind error:', err);
          throw new UnauthorizedException(err.message);
        }
        console.log('LDAP bind successful');

        //Get more user details such as profile pic and groups
        const searchOptions: SearchOptions = {
          /* 
          Note:
            1.Later we should add custom obj classes which specific for custom ldap schema (user should be able to add the schema while setting up the ldap settings)
            2.Currently we added default user obj classes and parent classes
          */
          filter: `(|(objectClass=user)(objectClass=inetOrgPerson)(objectClass=organizationalPerson)(objectClass=person))` /* objectClass `user` - specifically for microsoft active directory */,
          scope: 'sub',
          attributes: ['*', 'memberOf'],
        };
        this.search(bindDn, searchOptions, client, async (searchResult: any) => {
          if (Object.keys(searchResult).length) {
            const { mail, memberOf: groups, displayName, givenName, cn, uid } = searchResult;
            const fullName = displayName ?? givenName ?? cn;

            /* these are the possible properties for image of an user */
            const profilePhoto =
              searchResult?.jpegPhoto ||
              searchResult?.thumbnailPhoto ||
              searchResult?.exchangePhoto ||
              searchResult?.photo ||
              searchResult?.thumbnailLogo;

            const name = this.extractFirstAndLastName(fullName);

            const ssoResponse = {
              userSSOId: uid,
              firstName: name.firstName,
              lastName: name.lastName,
              email: Array.isArray(mail) ? mail[0] : mail,
              sso: 'ldap',
              groups,
              profilePhoto,
              userinfoResponse: searchResult,
            };

            await this.unbindLdapClient(client);
            resolve(ssoResponse);
          } else {
            throw new UnauthorizedException('User does not exist. Please contact admin.');
          }
        });
      });
    });
  }

  extractFirstAndLastName(fullName: string) {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return {
      firstName: firstName,
      lastName: lastName,
    };
  }

  async initializeLdapClient(configs: any) {
    const { host, port, ssl, sslCerts } = configs;
    const ldapUrl = `${ssl ? 'ldaps' : 'ldap'}://${host}:${port}`;

    const tlsOptions: TlsOptions = {
      key: sslCerts?.client_key,
      cert: sslCerts?.client_cert,
      ca: [sslCerts?.server_cert],
      rejectUnauthorized: true,
    };

    // Create a client and connect to the LDAP server
    // TODO-muhsin: Error handling for the connection
    return createClient({
      url: ldapUrl,
      ...(ssl && sslCerts && Object.values(sslCerts)?.length !== 0 ? { tlsOptions } : {}),
    });
  }

  async unbindLdapClient(client: Client) {
    //Unbind and close the connection when finished
    client.unbind((unbindErr) => {
      if (unbindErr) {
        console.error('LDAP unbind error:', unbindErr);
      } else {
        console.log('LDAP client disconnected');
      }
    });
  }

  async search(dn: string, options: SearchOptions, client: Client, callback: any) {
    let entries = {};
    client.search(dn, options, (err, res) => {
      if (err) return err;

      res.on('searchEntry', (entry) => {
        entries = this.#getProperObject(entry);
      });
      res.on('error', (err) => {
        console.error('error: ' + err.message);
        throw new UnauthorizedException(err?.message || 'Cannot get user details from LDAP server');
      });
      res.on('end', () => {
        callback(entries);
      });
    });
  }

  #getProperObject(entry: any) {
    const obj = {
      dn: entry.dn.toString(),
      controls: [],
    };
    const imageTypes = ['jpegPhoto', 'thumbnailPhoto', 'exchangePhoto', 'photo', 'thumbnailLogo'];
    entry.attributes.forEach(function (a: any) {
      //Process data except hashed password
      if (a.type !== 'userPassword') {
        const buf = a.buffers;
        const val = a.values;
        let item: any;
        if (imageTypes.includes(a.type)) item = buf;
        else item = val;
        if (item && item.length) {
          if (item.length > 1) {
            obj[a.type] = item.slice();
          } else {
            obj[a.type] = item[0];
          }
        } else {
          obj[a.type] = [];
        }
        /* trim only name from the group dn */
        if (a.type === 'memberOf') {
          obj[a.type] = obj[a.type].lenght
            ? obj[a.type].map((groupDN: string) => {
                return groupDN.split(',')[0].split('=')[1];
              })
            : [obj[a.type].split(',')[0].split('=')[1]];
        }
      }
    });
    entry.controls.forEach(function (element: any) {
      obj.controls.push(element.json);
    });
    return obj;
  }
}
