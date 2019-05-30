/*
Copyright (C) 2019 Stiftung Pillar Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// tslint:disable: object-shorthand-properties-first
import { Register } from '../../lib/register';
import { Requester } from '../../utils/requester';
import { Configuration } from '../../lib/configuration';
import { v4 as uuidV4 } from 'uuid';
import axios from 'axios';
jest.mock('axios');
import { default as postConfiguration } from '../../utils/requester-configurations/post';
import { default as getConfiguration } from '../../utils/requester-configurations/get';
import { PillarSdk } from '../..';

describe('Register Class', () => {
  const apiUrl = Configuration.accessKeys.apiUrl;
  Configuration.accessKeys.apiUrl = 'https://localhost:8080';
  const publicKey = 'myPub';
  const privateKey = 'myPrivateKey';
  const pSdk = new PillarSdk({});
  let uuid;

  beforeEach(() => {
    uuid = uuidV4();
  });

  afterAll(() => {
    Configuration.accessKeys.apiUrl = apiUrl;
    jest.restoreAllMocks();
  });

  describe('registerKeys', () => {
    const regKeysResponse = {
      status: 200,
      data: {
        expiresAt: '2011-06-14T04:12:36Z',
        nonce: '4321',
      },
    };

    it('should send http request containing publicKey and identifier', () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue('');
      Register.registerKeys(publicKey, uuid);
      expect(Requester.execute).toHaveBeenCalledWith({
        ...postConfiguration,
        data: {
          publicKey,
          uuid,
        },
        url: 'https://localhost:8080/register/keys',
      });
    });

    it('expects response to resolve with data', async () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue(regKeysResponse);
      const response = await Register.registerKeys(publicKey, uuid);
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(regKeysResponse.data);
    });
  });

  describe('registerAuth', () => {
    const regAuthResponse = {
      status: 200,
      data: {
        authorizationCode: 'Authorisation code',
        expiresAt: '2011-06-14T04:12:36Z',
      },
    };

    const data = {
      uuid,
      nonce: '4344132',
      codeChallenge: '323423423443423432432432',
      ethAddress: 'OneEthAddress',
      fcmToken: 'OneFcmToken',
      username: 'OneUserName',
    };

    it('should send http request containing data and privateKey', () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue('');
      const regAuthData = { ...data };
      delete regAuthData.nonce;
      Register.registerAuth(data, privateKey);
      expect(Requester.execute).toHaveBeenCalledWith({
        ...postConfiguration,
        headers: { 'X-API-Signature': expect.any(String) },
        data: regAuthData,
        url: 'https://localhost:8080/register/auth',
      });
    });

    it('expects response to resolve with data', async () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue(regAuthResponse);
      const response = await Register.registerAuth(data, privateKey);
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(regAuthResponse.data);
    });
  });

  describe('registerAccess', () => {
    const regAccessResponse = {
      status: 200,
      data: {
        accessToken: 'myAccessToken',
        accessTokenExpiresAt: 'YYYY-mm-ddTHH:MM:ssZ',
        fcmToken: 'myFcmToken',
        refreshToken: 'myRefreshToken',
        refreshTokenExpiresAt: 'YYYY-mm-ddTHH:MM:ssZ',
        userId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        walletId: '56b540e9-927a-4ced-a1be-61b059f33f2b',
      },
    };
    const data = {
      authorizationCode: 'myauthorizationCode',
      codeVerifier: 'oneCodeVerifier',
      uuid: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    };

    it('should send http request containing data and privateKey', () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue('');
      const regAccessData = { ...data };
      delete regAccessData.authorizationCode;
      Register.registerAccess(data, privateKey);
      expect(Requester.execute).toHaveBeenCalledWith({
        ...postConfiguration,
        headers: { 'X-API-Signature': expect.any(String) },
        data: regAccessData,
        url: 'https://localhost:8080/register/access',
      });
    });

    it('expects response to resolve with data', async () => {
      jest.spyOn(Requester, 'execute').mockResolvedValue(regAccessResponse);
      const response = await Register.registerAccess(data, privateKey);
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(regAccessResponse.data);
    });
  });

  describe('approveExternalLogin', () => {
    const approveExternalLoginResponse = {
      status: 'success',
      data: {
        expires: '2011-06-14T04:12:36Z',
      },
    };

    const approveExternalLoginData = {
      loginToken: 'loginToken',
    };

    it('should send http request containing loginToken', () => {
      Configuration.accessKeys.oAuthTokens = {
        refreshToken: 'myRefreshToken',
        accessToken: 'myAccessToken',
      };
      jest.spyOn(Requester, 'execute').mockResolvedValue('');
      pSdk.register.approveExternalLogin(approveExternalLoginData);
      expect(Requester.execute).toHaveBeenCalledWith({
        ...getConfiguration,
        headers: { Authorization: 'Bearer myAccessToken' },
        data: undefined,
        params: {
          ...approveExternalLoginData,
        },
        url: 'https://localhost:8080/register/approve-external-login',
      });
    });

    it('expects response to resolve with data', async () => {
      jest
        .spyOn(Requester, 'execute')
        .mockResolvedValue(approveExternalLoginResponse);
      const response = await pSdk.register.approveExternalLogin(
        approveExternalLoginData,
      );
      expect(response.status).toEqual('success');
      expect(response).toEqual(approveExternalLoginResponse);
    });
  });

  describe('refreshAuthToken', () => {
    const refreshAuthTokenResponse = {
      status: 200,
      data: {
        accessToken: 'myAccessToken',
        accessTokenExpiresAt: '2016-07-12T23:34:21Z',
        refreshToken: 'myRefreshToken',
        refreshTokenExpiresAt: '2016-07-12T23:34:21Z',
      },
    };

    it('should send http request containing data and header', async () => {
      Configuration.accessKeys.oAuthTokens.refreshToken = 'myRefreshToken';
      Configuration.accessKeys.oAuthTokens.accessToken = 'myAccessToken';
      Configuration.accessKeys.username = 'refreshUsername';
      axios.mockResolvedValue('');
      await Register.refreshAuthToken();
      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        headers: {},
        data: {
          refreshToken: 'myRefreshToken',
          username: Configuration.accessKeys.username,
        },
        url: 'https://localhost:8080/register/refresh',
        json: true,
        httpsAgent: expect.any(Object),
      });
    });

    it('expects response to resolve with data', async () => {
      axios.mockResolvedValue(refreshAuthTokenResponse);
      const response = await Register.refreshAuthToken();
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(refreshAuthTokenResponse.data);
    });
  });
});
