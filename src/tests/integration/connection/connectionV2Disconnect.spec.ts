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
// check node environment
const env = process.env.NODE_ENV;

import { PillarSdk } from '../../..';
import nock = require('nock');
import { Configuration } from '../../../lib/configuration';

describe('Connection v2 Disconnect', () => {
  // Key pairs
  const EC = require('elliptic').ec;
  const ecSecp256k1 = new EC('secp256k1');

  let targetPrivateKey = ecSecp256k1
    .genKeyPair()
    .getPrivate()
    .toString('hex');

  if (targetPrivateKey.length !== 64) {
    targetPrivateKey =
      '9c463304d4e7ad61f2bcdedb892d46af2a0160b24daa7e7f3a565ace3ccfb4ea';
  }

  let sourcePrivateKey = ecSecp256k1
    .genKeyPair()
    .getPrivate()
    .toString('hex');

  if (sourcePrivateKey.length !== 64) {
    sourcePrivateKey =
      'db07b0c6d1451d39a8486cb7f1fe3e5ce7fb498fd20dc5eec16097aa2b432ef9';
  }

  // Generate random username
  let username = `User${Math.random()
    .toString(36)
    .substring(7)}`;

  const sourceIdentityKey = Math.random()
    .toString(36)
    .substring(7);

  const targetIdentityKey = Math.random()
    .toString(36)
    .substring(7);

  let sourceUserWalletId: string;
  let targetUserWalletId: string;
  let targetUserId: string;
  let sourceUserAccessToken: string;
  let targetUserAccessToken: string;
  let sourceUserId: string;
  let pSdk: PillarSdk;

  const responseData = {
    result: 'success',
    message: 'Connection is successfully disconnected',
  };

  const responseDataConnectionInvite = {
    result: 'success',
    message: 'Connection invitation was successfully sent.',
  };

  const responseDataConnectionAccept = {
    result: 'success',
    message: 'Connection invitation accepted',
  };

  const errInvalidWalletId = {
    message: 'Could not find a Wallet ID to search by.',
  };

  const errInternal = {
    message: 'Internal Server Error',
  };

  beforeAll(async () => {
    pSdk = new PillarSdk({});
    pSdk.configuration.setUsername('username');

    if (env === 'test') {
      const mockApi = nock('https://localhost:8080');
      mockApi
        .post('/register/keys')
        .reply(200, {
          expiresAt: '2015-03-21T05:41:32Z',
          nonce: 'AxCDF23232',
        })
        .post('/register/auth')
        .reply(200, {
          authorizationCode: 'Authorization code',
          expiresAt: '2011-06-14T04:12:36Z',
        })
        .post('/register/access')
        .reply(200, {
          accessToken: 'accessToken',
          refreshToken: 'refreshToken',
          walletId: 'targetWalletId',
          userId: 'targetUserId',
        })
        .post('/register/keys')
        .reply(200, {
          expiresAt: '2015-03-21T05:41:32Z',
          nonce: 'AxCDF23232',
        })
        .post('/register/auth')
        .reply(200, {
          authorizationCode: 'Authorization code',
          expiresAt: '2011-06-14T04:12:36Z',
        })
        .post('/register/access')
        .reply(200, {
          accessToken: 'accessToken',
          refreshToken: 'refreshToken',
          walletId: 'sourceWalletId',
          userId: 'sourceUserId',
        })
        .post('/connection/v2/invite')
        .reply(200, responseDataConnectionInvite)
        .post('/connection/v2/accept')
        .reply(200, responseDataConnectionAccept)
        .post('/connection/v2/disconnect')
        .reply(200, responseData)
        .post('/connection/v2/disconnect')
        .reply(400, errInvalidWalletId)
        .post('/connection/v2/disconnect')
        .reply(500, errInternal);
    }

    let walletRegister = {
      privateKey: targetPrivateKey,
      fcmToken: '987qwe1',
      username,
    };

    let response = await pSdk.wallet.registerAuthServer(walletRegister);
    targetUserId = response.data.userId;
    targetUserWalletId = response.data.walletId;
    targetUserAccessToken = Configuration.accessKeys.oAuthTokens.accessToken;

    username = `User${Math.random()
      .toString(36)
      .substring(7)}`;

    walletRegister = {
      privateKey: sourcePrivateKey,
      fcmToken: '987qwe2',
      username,
    };

    response = await pSdk.wallet.registerAuthServer(walletRegister);
    sourceUserWalletId = response.data.walletId;
    sourceUserId = response.data.userId;
    sourceUserAccessToken = Configuration.accessKeys.oAuthTokens.accessToken;

    const inviteParams = {
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId: sourceUserWalletId,
    };

    await pSdk.connectionV2.invite(inviteParams);

    Configuration.accessKeys.oAuthTokens.accessToken = targetUserAccessToken;

    const acceptParams = {
      targetUserId: sourceUserId,
      sourceUserIdentityKeys: {
        sourceIdentityKey: Math.random()
          .toString(36)
          .substring(7),
        targetIdentityKey: Math.random()
          .toString(36)
          .substring(7),
      },
      targetUserIdentityKeys: {
        sourceIdentityKey,
        targetIdentityKey,
      },
      walletId: targetUserWalletId,
    };

    await pSdk.connectionV2.accept(acceptParams);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    if (env === 'test') {
      nock.cleanAll();
    }
  });

  it('expects to return a success message and status 200', async () => {
    const inputParams = {
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId: sourceUserWalletId,
    };

    Configuration.accessKeys.oAuthTokens.accessToken = sourceUserAccessToken;

    const response = await pSdk.connectionV2.disconnect(inputParams);
    expect(response.status).toBe(200);
    expect(response.data).toEqual(responseData);
  });

  it('should return 400 due invalid params', async () => {
    const inputParams = {
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId: '',
    };

    try {
      await pSdk.connectionV2.disconnect(inputParams);
    } catch (error) {
      expect(error.response.status).toEqual(400);
      expect(error.response.data.message).toEqual(errInvalidWalletId.message);
    }
  });

  if (env === 'test') {
    it('should return 500 due internal server error', async () => {
      const inputParams = {
        targetUserId,
        sourceIdentityKey,
        targetIdentityKey,
        walletId: sourceUserWalletId,
      };

      try {
        await pSdk.connectionV2.disconnect(inputParams);
      } catch (error) {
        expect(error.response.status).toEqual(500);
        expect(error.response.data.message).toEqual(errInternal.message);
      }
    });
  }
});
