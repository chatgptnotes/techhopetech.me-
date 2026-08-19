import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { db } from '@/lib/supabase-admin';
import { decryptSecret } from '@/lib/linkedin';
import { HttpError } from '@/lib/marketing-auth';

export type InstagramAccount = {
  id: string;
  organization_urn: string;
  organization_name: string;
  member_urn: string;
  access_token_encrypted: string;
  access_expires_at: string | null;
  status: string;
};

export type InstagramPost = {
  id: string;
  campaign_id: string | null;
  provider_account_id: string;
  body: string;
  content_type: string;
  media_path: string;
  external_post_urn?: string | null;
};

const META_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const META_GRAPH = `https://graph.facebook.com/${META_VERSION}`;

function stateSecret() {
  return process.env.META_OAUTH_STATE_SECRET
    || process.env.LINKEDIN_OAUTH_STATE_SECRET
    || process.env.META_TOKEN_ENCRYPTION_KEY
    || process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY
    || '';
}

export function createInstagramOAuthState(userId: string) {
  const secret = stateSecret();
  if (secret.length < 32) throw new HttpError('META_OAUTH_STATE_SECRET is not configured', 503);
  const payload = Buffer.from(JSON.stringify({
    userId,
    nonce: randomBytes(16).toString('hex'),
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyInstagramOAuthState(state: string) {
  const [payload, signature] = state.split('.');
  const secret = stateSecret();
  if (!payload || !signature || secret.length < 32) throw new HttpError('Invalid Instagram OAuth state', 400);
  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new HttpError('Invalid Instagram OAuth state', 400);
  }
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    userId: string;
    expiresAt: number;
  };
  if (!parsed.userId || parsed.expiresAt < Date.now()) {
    throw new HttpError('Instagram OAuth state expired', 400);
  }
  return parsed;
}

export function instagramRedirectUri(origin?: string) {
  const appUrl = (process.env.APP_URL || origin || 'https://hopetech.me').replace(/\/$/, '');
  return `${appUrl}/api/hopetech/instagram/callback`;
}

export function instagramAuthorizationUrl(userId: string, origin?: string) {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new HttpError('META_APP_ID is not configured', 503);
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: instagramRedirectUri(origin),
    state: createInstagramOAuthState(userId),
    response_type: 'code',
  });
  const configId = process.env.META_LOGIN_CONFIG_ID;
  if (configId) {
    params.set('config_id', configId);
    params.set('override_default_response_type', 'true');
  } else {
    const scopes = (
      process.env.META_INSTAGRAM_SCOPES
      || 'pages_show_list instagram_basic instagram_content_publish pages_read_engagement'
    ).split(/\s+/).filter(Boolean);
    params.set('scope', scopes.join(','));
  }
  return `https://www.facebook.com/${META_VERSION}/dialog/oauth?${params}`;
}

async function metaJson<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json().catch(() => ({})) as T & {
    error?: { message?: string; code?: number };
  };
  if (!response.ok || result.error) {
    const error = new HttpError(
      result.error?.message || `Instagram request failed (${response.status})`,
      response.status === 429 ? 429 : 502,
    );
    Object.assign(error, { providerStatus: response.status || result.error?.code || 0 });
    throw error;
  }
  return result;
}

export async function exchangeInstagramAuthorizationCode(code: string, origin?: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new HttpError('Meta app credentials are not configured', 503);
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: instagramRedirectUri(origin),
    code,
  });
  const shortLived = await metaJson<{ access_token?: string; expires_in?: number }>(
    `${META_GRAPH}/oauth/access_token?${params}`,
  );
  if (!shortLived.access_token) throw new HttpError('Meta did not return an access token', 502);

  const longParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLived.access_token,
  });
  try {
    const longLived = await metaJson<{ access_token?: string; expires_in?: number }>(
      `${META_GRAPH}/oauth/access_token?${longParams}`,
    );
    return {
      accessToken: longLived.access_token || shortLived.access_token,
      expiresIn: Number(longLived.expires_in || shortLived.expires_in || 3600),
    };
  } catch {
    return {
      accessToken: shortLived.access_token,
      expiresIn: Number(shortLived.expires_in || 3600),
    };
  }
}

export type InstagramPage = {
  id: string;
  name: string;
  access_token: string;
  tasks?: string[];
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
};

export async function instagramPages(userAccessToken: string) {
  const fields = 'id,name,access_token,tasks,instagram_business_account{id,username,profile_picture_url}';
  const params = new URLSearchParams({
    fields,
    limit: '100',
    access_token: userAccessToken,
  });
  const result = await metaJson<{ data?: InstagramPage[] }>(`${META_GRAPH}/me/accounts?${params}`);
  return (result.data || []).filter(page => page.access_token && page.instagram_business_account?.id);
}

async function signedMediaUrl(path: string) {
  const { data, error } = await db.storage.from('marketing-media').createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw new HttpError('The Instagram image could not be made available', 500);
  return data.signedUrl;
}

async function instagramFetch<T>(
  account: InstagramAccount,
  path: string,
  init: RequestInit = {},
) {
  const accessToken = decryptSecret(account.access_token_encrypted);
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
  }
  return metaJson<T>(path.startsWith('http') ? path : `${META_GRAPH}${path}`, {
    ...init,
    headers,
    body: init.body instanceof URLSearchParams
      ? new URLSearchParams([...init.body.entries(), ['access_token', accessToken]])
      : init.body,
  });
}

function wait(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

async function waitForInstagramContainer(
  account: InstagramAccount,
  containerId: string,
) {
  const attempts = 6;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await instagramFetch<{ status_code?: string }>(
      account,
      `/${containerId}?fields=status_code&access_token=${encodeURIComponent(
        decryptSecret(account.access_token_encrypted),
      )}`,
    );
    const status = String(result.status_code || '').toUpperCase();
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new HttpError(`Instagram media processing ${status.toLowerCase()}`, 502);
    }
    if (attempt < attempts - 1) await wait(5_000);
  }
  throw new HttpError(
    'Instagram is still processing the image. Wait a minute and try Publish now again.',
    409,
  );
}

export async function publishInstagramPost(account: InstagramAccount, post: InstagramPost) {
  if (post.content_type !== 'image' || !post.media_path) {
    throw new HttpError('Instagram feed publishing requires an image', 400);
  }
  if (!/\.jpe?g$/i.test(post.media_path)) {
    throw new HttpError('Instagram feed publishing currently requires a JPEG image', 400);
  }
  const media = await instagramFetch<{ id?: string }>(account, `/${account.organization_urn}/media`, {
    method: 'POST',
    body: new URLSearchParams({
      image_url: await signedMediaUrl(post.media_path),
      caption: post.body,
    }),
  });
  if (!media.id) throw new HttpError('Instagram did not create a media container', 502);
  await waitForInstagramContainer(account, media.id);
  const published = await instagramFetch<{ id?: string }>(
    account,
    `/${account.organization_urn}/media_publish`,
    {
      method: 'POST',
      body: new URLSearchParams({ creation_id: media.id }),
    },
  );
  if (!published.id) throw new HttpError('Instagram did not return a published media ID', 502);
  const details = await instagramFetch<{ permalink?: string }>(
    account,
    `/${published.id}?fields=permalink&access_token=${encodeURIComponent(decryptSecret(account.access_token_encrypted))}`,
  );
  return {
    urn: published.id,
    url: details.permalink || `https://www.instagram.com/${account.organization_name}/`,
  };
}

export async function fetchInstagramPostActivity(account: InstagramAccount, mediaId: string) {
  const accessToken = decryptSecret(account.access_token_encrypted);
  const fields = 'id,permalink,like_count,comments_count';
  const params = new URLSearchParams({ fields, access_token: accessToken });
  return metaJson<{
    id?: string;
    permalink?: string;
    like_count?: number;
    comments_count?: number;
  }>(`${META_GRAPH}/${mediaId}?${params}`);
}
