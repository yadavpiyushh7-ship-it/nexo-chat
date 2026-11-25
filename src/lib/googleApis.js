import { useState, useEffect, useCallback } from 'react';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

const TOKEN_STORAGE_KEY = 'nexo_google_oauth_token';
const USER_STORAGE_KEY = 'nexo_google_oauth_user';
const AUTH_EVENT_NAME = 'nexo-google-auth-changed';

export function ensureGisScriptLoaded() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.oauth2)));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(Boolean(window.google?.accounts?.oauth2)), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.accounts?.oauth2));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function readStoredAuth() {
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
    const rawUser = sessionStorage.getItem(USER_STORAGE_KEY);
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function writeStoredAuth(token, user) {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);

    if (user) sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  }
}

export function useGoogleAuth() {
  const [auth, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sync = () => setAuth(readStoredAuth());
    window.addEventListener(AUTH_EVENT_NAME, sync);
    return () => window.removeEventListener(AUTH_EVENT_NAME, sync);
  }, []);

  const signIn = useCallback(async () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      const msg = 'Set VITE_GOOGLE_CLIENT_ID in .env to enable Google OAuth 2.0 (Gmail, Contacts, Slides, Sheets, YouTube).';
      setError(msg);
      return { ok: false, error: msg };
    }

    setLoading(true);
    const loaded = await ensureGisScriptLoaded();
    if (!loaded || !window.google?.accounts?.oauth2) {
      setLoading(false);
      const msg = 'Google Identity Services failed to load. Check network or ad-blocker.';
      setError(msg);
      return { ok: false, error: msg };
    }

    return new Promise((resolve) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_OAUTH_SCOPES,
          callback: async (tokenResponse) => {
            if (tokenResponse?.error || !tokenResponse?.access_token) {
              setLoading(false);
              const errMsg =
                tokenResponse?.error_description ||
                tokenResponse?.error ||
                'Google sign-in was cancelled.';
              setError(errMsg);
              resolve({ ok: false, error: errMsg });
              return;
            }

            const accessToken = tokenResponse.access_token;
            let profile = { email: 'Connected Google Account', name: 'Google User', picture: '' };
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (profileRes.ok) {
                const p = await profileRes.json();
                profile = {
                  email: p.email || profile.email,
                  name: p.name || profile.name,
                  picture: p.picture || '',
                };
              }
            } catch {}

            writeStoredAuth(accessToken, profile);
            setAuth({ token: accessToken, user: profile });
            setLoading(false);
            resolve({ ok: true, token: accessToken, user: profile });
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        setLoading(false);
        const msg = err?.message || 'Google OAuth initialization failed';
        setError(msg);
        resolve({ ok: false, error: msg });
      }
    });
  }, []);

  const signOut = useCallback(() => {
    const current = readStoredAuth();
    try {
      if (current.token && window.google?.accounts?.oauth2?.revoke) {
        window.google.accounts.oauth2.revoke(current.token, () => {});
      }
    } catch {}
    writeStoredAuth(null, null);
    setAuth({ token: null, user: null });
    setError('');
  }, []);

  return {
    token: auth.token,
    user: auth.user,
    isSignedIn: Boolean(auth.token && auth.user),
    loading,
    error,
    clearError: () => setError(''),
    signIn,
    signOut,
  };
}

/**
 * Google People API: Fetch friends/contacts with names, emails & photos
 */
export async function fetchGoogleContacts(accessToken) {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=30',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    let msg = `Google People API returned HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  const connections = Array.isArray(data.connections) ? data.connections : [];

  return connections
    .map((person, idx) => {
      const name = person.names?.[0]?.displayName || '';
      const email = person.emailAddresses?.[0]?.value || '';
      const photo = person.photos?.[0]?.url || '';
      if (!name && !email) return null;
      const baseHandle = (email ? email.split('@')[0] : name)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      return {
        id: person.resourceName || `gcontact_${idx}_${Date.now()}`,
        full_name: name || email.split('@')[0],
        email,
        photo,
        username: `@${baseHandle}`,
        mood: email ? `Google Contact • ${email}` : 'Google Contact',
      };
    })
    .filter(Boolean);
}

/**
 * Google Slides API: Create a formatted presentation deck and populate MoM / AI slides
 */
export async function exportPresentationToGoogleSlides({ accessToken, title, bodyText }) {
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    let msg = `Google Slides API returned HTTP ${createRes.status}`;
    try {
      const err = await createRes.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const pres = await createRes.json();
  const presentationId = pres.presentationId;
  const firstSlide = pres.slides?.[0];

  const requests = [];
  if (firstSlide?.pageElements) {
    const titleEl = firstSlide.pageElements.find((el) => el.shape?.placeholder?.type === 'CENTERED_TITLE' || el.shape?.placeholder?.type === 'TITLE');
    const subEl = firstSlide.pageElements.find((el) => el.shape?.placeholder?.type === 'SUBTITLE');
    if (titleEl?.objectId) {
      requests.push({
        insertText: { objectId: titleEl.objectId, text: title },
      });
    }
    if (subEl?.objectId) {
      requests.push({
        insertText: {
          objectId: subEl.objectId,
          text: `Generated via Nexo AI Workspace • ${new Date().toLocaleDateString()}`,
        },
      });
    }
  }

  // Split content cleanly into chunks of ~950 chars across formatted content slides
  const cleanText = (bodyText || '').replace(/\*\*/g, '');
  const paragraphs = cleanText.split(/\n{2,}/).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > 900 && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  if (chunks.length === 0) chunks.push(cleanText || 'Nexo Presentation Notes');

  chunks.slice(0, 6).forEach((chunk, idx) => {
    const slideId = `nexo_slide_${idx}_${Date.now()}`;
    const titleId = `nexo_title_${idx}_${Date.now()}`;
    const bodyId = `nexo_body_${idx}_${Date.now()}`;

    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
        placeholderIdMappings: [
          { layoutPlaceholder: { type: 'TITLE', index: 0 }, objectId: titleId },
          { layoutPlaceholder: { type: 'BODY', index: 0 }, objectId: bodyId },
        ],
      },
    });
    requests.push({
      insertText: {
        objectId: titleId,
        text: chunks.length > 1 ? `${title} (${idx + 1}/${Math.min(chunks.length, 6)})` : title,
      },
    });
    requests.push({
      insertText: {
        objectId: bodyId,
        text: chunk,
      },
    });
  });

  if (requests.length > 0) {
    await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  return {
    presentationId,
    url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
  };
}

/**
 * Google Sheets API: Create a live DSA & Campus Placement Tracker spreadsheet
 */
export async function exportTrackerToGoogleSheets({ accessToken, title, rows }) {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'Placement & DSA Tracker' } }],
    }),
  });

  if (!createRes.ok) {
    let msg = `Google Sheets API returned HTTP ${createRes.status}`;
    try {
      const err = await createRes.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;

  if (Array.isArray(rows) && rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );
  }

  return {
    spreadsheetId,
    url: sheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
