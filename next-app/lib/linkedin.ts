import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { db } from '@/lib/supabase-admin';
import { HttpError } from '@/lib/marketing-auth';

type SocialAccount = {
  id: string;
  organization_urn: string;
  organization_name: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  access_expires_at: string | null;
  refresh_expires_at: string | null;
  status: string;
};

type SocialPost = {
  id: string;
  campaign_id: string | null;
  provider_account_id: string;
  body: string;
  content_type: string;
  media_path: string;
  link_url: string;
  link_title: string;
  link_description: string;
  external_post_urn?: string | null;
};

const LINKEDIN_API = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || '202606';

function encryptionKey() {
  const source = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
  if (!source || source.length < 32) {
    throw new HttpError(
      'META_TOKEN_ENCRYPTION_KEY or LINKEDIN_TOKEN_ENCRYPTION_KEY must contain at least 32 characters',
      503,
    );
  }
  return createHash('sha256').update(source).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptSecret(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new HttpError('Stored LinkedIn credentials are invalid', 500);
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function stateSecret() {
  return process.env.LINKEDIN_OAUTH_STATE_SECRET || process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY || '';
}

export function createOAuthState(userId: string) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    nonce: randomBytes(16).toString('hex'),
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', stateSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string) {
  const [payload, signature] = state.split('.');
  if (!payload || !signature || !stateSecret()) throw new HttpError('Invalid LinkedIn OAuth state', 400);
  const expected = createHmac('sha256', stateSecret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new HttpError('Invalid LinkedIn OAuth state', 400);
  }
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    userId: string;
    expiresAt: number;
  };
  if (!parsed.userId || parsed.expiresAt < Date.now()) throw new HttpError('LinkedIn OAuth state expired', 400);
  return parsed;
}

export function linkedInRedirectUri(origin?: string) {
  const appUrl = (process.env.APP_URL || origin || 'https://hopetech.me').replace(/\/$/, '');
  return `${appUrl}/api/hopetech/linkedin/callback`;
}

export function linkedInAuthorizationUrl(userId: string, origin?: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new HttpError('LINKEDIN_CLIENT_ID is not configured', 503);
  const scopes = (
    process.env.LINKEDIN_SCOPES
    || 'openid profile w_organization_social r_organization_social w_organization_social_feed r_organization_social_feed rw_organization_admin'
  ).split(/\s+/).filter(Boolean);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: linkedInRedirectUri(origin),
    state: createOAuthState(userId),
    scope: scopes.join(' '),
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeAuthorizationCode(code: string, origin?: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new HttpError('LinkedIn OAuth credentials are not configured', 503);
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: linkedInRedirectUri(origin),
    }),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) {
    throw new HttpError(result.error_description || result.message || 'LinkedIn token exchange failed', 502);
  }
  return result as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope?: string;
  };
}

export async function linkedInMember(accessToken: string) {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) return { urn: '', name: '' };
  const user = await response.json() as { sub?: string; name?: string };
  return {
    urn: user.sub ? `urn:li:user:${user.sub}` : '',
    name: String(user.name || ''),
  };
}

export async function subscribeToOrganizationNotifications(
  accessToken: string,
  memberUrn: string,
  organizationUrn: string,
  origin?: string,
) {
  const applicationId = process.env.LINKEDIN_APPLICATION_ID || process.env.LINKEDIN_CLIENT_ID || '';
  if (!applicationId || !memberUrn) return 'Webhook subscription requires a LinkedIn application ID and member identity.';
  const appUrl = (process.env.APP_URL || origin || 'https://hopetech.me').replace(/\/$/, '');
  const subscriptionUrn = [
    `(developerApplication:urn:li:developerApplication:${applicationId}`,
    `user:${memberUrn}`,
    `entity:${organizationUrn}`,
    'eventType:ORGANIZATION_SOCIAL_ACTION_NOTIFICATIONS)',
  ].join(',');
  const response = await fetch(`${LINKEDIN_API}/eventSubscriptions/${encodeURIComponent(subscriptionUrn)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ webhook: `${appUrl}/api/hopetech/linkedin/webhook` }),
    cache: 'no-store',
  });
  if (response.ok) return '';
  const result = await response.json().catch(() => ({})) as { message?: string };
  return result.message || 'LinkedIn connected, but the response webhook subscription was not accepted.';
}

async function refreshAccount(account: SocialAccount) {
  const expiresAt = account.access_expires_at ? new Date(account.access_expires_at).getTime() : 0;
  if (!expiresAt || expiresAt > Date.now() + 5 * 60 * 1000) return decryptSecret(account.access_token_encrypted);
  if (!account.refresh_token_encrypted) {
    await db.from('marketing_social_accounts').update({
      status: 'Reconnect Required',
      last_error: 'LinkedIn access token expired and no refresh token is available.',
      updated_at: new Date().toISOString(),
    }).eq('id', account.id);
    throw new HttpError('LinkedIn must be reconnected', 409);
  }

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptSecret(account.refresh_token_encrypted),
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) {
    await db.from('marketing_social_accounts').update({
      status: 'Reconnect Required',
      last_error: result.error_description || 'LinkedIn token refresh failed.',
      updated_at: new Date().toISOString(),
    }).eq('id', account.id);
    throw new HttpError('LinkedIn must be reconnected', 409);
  }

  const updates = {
    access_token_encrypted: encryptSecret(result.access_token),
    refresh_token_encrypted: result.refresh_token
      ? encryptSecret(result.refresh_token)
      : account.refresh_token_encrypted,
    access_expires_at: new Date(Date.now() + Number(result.expires_in || 3600) * 1000).toISOString(),
    status: 'Connected',
    last_error: '',
    updated_at: new Date().toISOString(),
  };
  await db.from('marketing_social_accounts').update(updates).eq('id', account.id);
  return result.access_token as string;
}

async function linkedInFetch<T>(
  account: SocialAccount,
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; response: Response }> {
  const token = await refreshAccount(account);
  const response = await fetch(path.startsWith('http') ? path : `${LINKEDIN_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const result = data as { message?: string; error_description?: string };
    const error = new HttpError(
      result.message || result.error_description || `LinkedIn request failed (${response.status})`,
      response.status === 429 ? 429 : 502,
    );
    Object.assign(error, { providerStatus: response.status });
    throw error;
  }
  return { data: data as T, response };
}

async function uploadImage(account: SocialAccount, mediaPath: string) {
  const { data: stored, error } = await db.storage.from('marketing-media').download(mediaPath);
  if (error || !stored) throw new HttpError('The post image could not be loaded', 500);
  const initialized = await linkedInFetch<{
    value?: { uploadUrl?: string; image?: string };
  }>(account, '/images?action=initializeUpload', {
    method: 'POST',
    body: JSON.stringify({ initializeUploadRequest: { owner: account.organization_urn } }),
  });
  const uploadUrl = initialized.data.value?.uploadUrl;
  const image = initialized.data.value?.image;
  if (!uploadUrl || !image) throw new HttpError('LinkedIn did not initialize the image upload', 502);
  const token = await refreshAccount(account);
  const uploaded = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': stored.type || 'application/octet-stream',
    },
    body: Buffer.from(await stored.arrayBuffer()),
  });
  if (!uploaded.ok) throw new HttpError('LinkedIn image upload failed', 502);
  return image;
}

export async function publishLinkedInPost(account: SocialAccount, post: SocialPost) {
  let content: Record<string, unknown> | undefined;
  if (post.content_type === 'image' && post.media_path) {
    content = { media: { id: await uploadImage(account, post.media_path) } };
  } else if (post.content_type === 'link' && post.link_url) {
    content = {
      article: {
        source: post.link_url,
        title: post.link_title || post.link_url,
        description: post.link_description || '',
      },
    };
  }

  const result = await linkedInFetch<Record<string, never>>(account, '/posts', {
    method: 'POST',
    body: JSON.stringify({
      author: account.organization_urn,
      commentary: post.body,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
      ...(content ? { content } : {}),
    }),
  });
  const urn = result.response.headers.get('x-restli-id');
  if (!urn) throw new HttpError('LinkedIn published the request without returning a post ID', 502);
  return {
    urn,
    url: `https://www.linkedin.com/feed/update/${urn}/`,
  };
}

export async function fetchLinkedInPostActivity(account: SocialAccount, postUrn: string) {
  const encodedUrn = encodeURIComponent(postUrn);
  const requests = await Promise.allSettled([
    linkedInFetch<{ elements?: Array<Record<string, any>> }>(
      account,
      `/socialActions/${encodedUrn}/comments?q=comments&count=100`,
    ),
    linkedInFetch<{ elements?: Array<Record<string, any>> }>(
      account,
      `/reactions/(entity:${encodedUrn})?q=entity&count=100`,
    ),
    linkedInFetch<{ elements?: Array<Record<string, any>> }>(
      account,
      `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(account.organization_urn)}&shares=List(${encodedUrn})`,
    ),
  ]);
  const successes = requests.filter(result => result.status === 'fulfilled');
  if (!successes.length) throw (requests[0] as PromiseRejectedResult).reason;
  const comments = requests[0].status === 'fulfilled' ? requests[0].value.data.elements || [] : [];
  const reactions = requests[1].status === 'fulfilled' ? requests[1].value.data.elements || [] : [];
  const statistics = requests[2].status === 'fulfilled'
    ? requests[2].value.data.elements?.[0]?.totalShareStatistics || {}
    : {};
  return {
    comments,
    reactions,
    statistics,
  };
}

export async function replyToLinkedInComment(
  account: SocialAccount,
  postUrn: string,
  parentCommentUrn: string,
  message: string,
) {
  const result = await linkedInFetch<Record<string, never>>(
    account,
    `/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        actor: account.organization_urn,
        object: postUrn,
        parentComment: parentCommentUrn,
        message: { text: message },
      }),
    },
  );
  return result.response.headers.get('x-restli-id') || `local-reply-${Date.now()}`;
}

export function linkedinWebhookChallenge(challengeCode: string) {
  const secret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!secret) throw new HttpError('LINKEDIN_CLIENT_SECRET is not configured', 503);
  return createHmac('sha256', secret).update(challengeCode).digest('hex');
}

export function verifyLinkedInWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(`hmacsha256=${rawBody}`).digest();
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type { SocialAccount, SocialPost };
