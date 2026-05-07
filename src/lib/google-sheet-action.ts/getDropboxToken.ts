import { prisma } from "@/lib/prisma";

import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

const DROPBOX_VALIDATE_URL = 'https://api.dropboxapi.com/2/check/user';

type DropboxSettingValue = {
  accessToken?: string;
  refreshToken?: string;
};

type DropboxClientWithAuth = Dropbox & {
  auth: {
    accessToken?: string;
    refreshAccessToken: () => Promise<void>;
  };
};

type DropboxTokenResult =
  | { success: true; token: string }
  | { success: false; error: unknown };

export async function getDropboxToken(): Promise<DropboxTokenResult> {
  try {
    const dropboxSetting = await prisma.setting.findUnique({
      where: {
        name: 'dropbox',
      },
    });

    if (!dropboxSetting) {
      return {
        success: false,
        error: 'Cannot find dropbox setting on DB',
      };
    }

    if (!dropboxSetting.value) {
      return {
        success: false,
        error: 'Dropbox setting value is empty',
      };
    }

    const tokenData = JSON.parse(dropboxSetting.value) as DropboxSettingValue;

    let dbx: DropboxClientWithAuth | null = null;
    if (tokenData.accessToken && tokenData.refreshToken) {
      dbx = new Dropbox({
        fetch,
        clientId: process.env.DROPBOX_APP_KEY || '',
        clientSecret: process.env.DROPBOX_APP_SECRET || '',
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        selectUser: process.env.DROPBOX_TEAM_MEMBER_ID || '',
        pathRoot: JSON.stringify({".tag": "root", "root": process.env.DROPBOX_ROOT_NAMESPACE_ID || '',}),
      }) as DropboxClientWithAuth;

      const checkUserResponse = await fetch(DROPBOX_VALIDATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
          'Dropbox-API-Select-User': `${process.env.DROPBOX_TEAM_MEMBER_ID || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!checkUserResponse.ok) {
        console.error('AccessToken is invalid');
        await dbx.auth.refreshAccessToken();
  
        await prisma.setting.update({
          where: {
            id: parseInt(dropboxSetting.id.toString()),
          },
          data: {
            value: JSON.stringify({
              accessToken: dbx.auth.accessToken,
              refreshToken: tokenData.refreshToken,
            })
          }
        });
      }
    } else if (tokenData.refreshToken) {
      dbx = new Dropbox({
        fetch,
        clientId: process.env.DROPBOX_APP_KEY || '',
        clientSecret: process.env.DROPBOX_APP_SECRET || '',
        refreshToken: tokenData.refreshToken,
        selectUser: process.env.DROPBOX_TEAM_MEMBER_ID || '',
      }) as DropboxClientWithAuth;

      await dbx.auth.refreshAccessToken();
  
      await prisma.setting.update({
        where: {
          id: parseInt(dropboxSetting.id.toString()),
        },
        data: {
          value: JSON.stringify({
            accessToken: dbx.auth.accessToken,
            refreshToken: tokenData.refreshToken,
          })
        }
      });
    } else {
      return {
        success: false,
        error: 'Cannot find dropbox API refreshToken',
      };
    }

    if (!dbx) {
      return {
        success: false,
        error: 'Unable to initialize Dropbox client',
      };
    }

    if (!dbx.auth.accessToken) {
      return {
        success: false,
        error: 'Dropbox access token is empty',
      };
    }

    return { 
      success: true, 
      token: dbx.auth.accessToken
    };
  } catch (error) {
    return { 
      success: false, 
      error: error
    };
  }
}

export default getDropboxToken;
