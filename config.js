// =====================================================================
// Configuração global do front-end
// =====================================================================
window.JC_CONFIG = {
  API_BASE_URL: 'http://localhost:4000/api',
};

/**
 * Wrapper de fetch que injeta automaticamente o token JWT (se existir)
 * e trata erros de forma padronizada em toda a aplicação.
 */
async function jcApiFetch(path, options = {}) {
  const token = sessionStorage.getItem('jc_token') || localStorage.getItem('jc_token');

  const response = await fetch(`${window.JC_CONFIG.API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(body?.message || 'Erro inesperado ao comunicar com o servidor.');
    error.status = response.status;
    error.code = body?.error;
    throw error;
  }

  return body;
}

function jcStoreSession({ token, profile, remember }) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem('jc_token', token);
  store.setItem('jc_profile', JSON.stringify(profile));
}

function jcGetSession() {
  const raw = sessionStorage.getItem('jc_profile') || localStorage.getItem('jc_profile');
  return raw ? JSON.parse(raw) : null;
}

function jcClearSession() {
  sessionStorage.removeItem('jc_token');
  sessionStorage.removeItem('jc_profile');
  localStorage.removeItem('jc_token');
  localStorage.removeItem('jc_profile');
}
