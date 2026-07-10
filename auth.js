// =====================================================================
// Tela de Login — J&S Creative & Marketing ERP
// =====================================================================
(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const twoFactorField = document.getElementById('twoFactorField');
  const twoFactorInput = document.getElementById('twoFactorCode');
  const rememberInput = document.getElementById('remember');
  const submitBtn = document.getElementById('submitBtn');
  const statusBox = document.getElementById('formStatus');
  const togglePasswordBtn = document.getElementById('togglePassword');

  // Se já existe sessão válida, pula direto para o dashboard.
  if (jcGetSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
  });

  function setStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = `form-status ${type === 'error' ? 'is-error' : 'is-success'}`;
  }

  function clearStatus() {
    statusBox.textContent = '';
    statusBox.className = 'form-status';
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading
      ? '<span class="jc-spinner" aria-hidden="true"></span> Verificando...'
      : 'Acessar plataforma';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setStatus('Preencha e-mail e senha para continuar.', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await jcApiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          twoFactorCode: twoFactorInput.value || undefined,
        }),
      });

      if (result.requiresTwoFactor && twoFactorField.style.display === 'none') {
        // Primeira etapa concluída: revela o campo de 2FA e interrompe
        // o fluxo até o código ser informado.
        twoFactorField.style.display = 'flex';
        setStatus('Digite o código de verificação enviado ao seu dispositivo.', 'success');
        setLoading(false);
        twoFactorInput.focus();
        return;
      }

      jcStoreSession({
        token: result.token,
        profile: result.profile,
        remember: rememberInput.checked,
      });

      setStatus('Acesso confirmado. Redirecionando...', 'success');
      window.location.href = 'dashboard.html';
    } catch (err) {
      const message =
        err.code === 'credenciais_invalidas'
          ? 'E-mail ou senha incorretos. Verifique e tente novamente.'
          : err.code === 'usuario_inativo'
          ? 'Este acesso foi desativado. Contate o administrador.'
          : err.code === 'muitas_tentativas'
          ? 'Muitas tentativas de login. Aguarde alguns minutos.'
          : 'Não foi possível conectar ao servidor. Tente novamente.';
      setStatus(message, 'error');
      setLoading(false);
    }
  });
})();
