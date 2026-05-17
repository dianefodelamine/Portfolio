/**
 * admin.js - Scripts spécifiques à l'interface d'administration
 */

document.addEventListener('DOMContentLoaded', () => {
  initToasts();
  initUnsavedChangesWarning();
  initFormSimulation();
  initImagePreview();
  initDeleteConfirmations();
  initCharts();
  initWysiwygEditors();
  initAuth();
  initAdminPages();
});

/* ==========================================================================
   1. Système de Notifications (Toasts)
   ========================================================================== */
function initToasts() {
  // Créer le conteneur de toasts s'il n'existe pas
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Affiche une notification toast
 * @param {string} message - Le message à afficher
 * @param {string} type - 'success', 'error', 'info'
 */
window.showToast = function(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Fermer">&times;</button>
  `;

  container.appendChild(toast);

  // Animation d'entrée
  setTimeout(() => toast.classList.add('show'), 10);

  // Fermeture automatique après 3 secondes
  const timeout = setTimeout(() => {
    closeToast(toast);
  }, 3000);

  // Fermeture manuelle
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timeout);
    closeToast(toast);
  });
};

function closeToast(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });
}

/* ==========================================================================
   2. Avertissement de modifications non sauvegardées
   ========================================================================== */
function initUnsavedChangesWarning() {
  let isDirty = false;
  const forms = document.querySelectorAll('.edit-form');

  forms.forEach(form => {
    // Détecter tout changement dans le formulaire
    form.addEventListener('input', () => {
      isDirty = true;
    });

    // Lors de la soumission, réinitialiser l'état
    form.addEventListener('submit', () => {
      isDirty = false;
    });
  });

  // Avertir avant de quitter la page si des modifications ne sont pas sauvegardées
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      const confirmationMessage = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter cette page ?';
      e.returnValue = confirmationMessage; // Standard
      return confirmationMessage; // Pour certains navigateurs
    }
  });
}

/* ==========================================================================
   3. Simulation de soumission de formulaire (Pour la démo)
   ========================================================================== */
function initFormSimulation() {
  const forms = document.querySelectorAll('.edit-form');
  
  forms.forEach(form => {
    if (form.dataset.api === 'true') {
      return;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Empêcher le rechargement de la page
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // État de chargement
      submitBtn.textContent = 'Enregistrement...';
      submitBtn.disabled = true;

      // Simuler une requête réseau de 800ms
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Afficher le toast de succès
        window.showToast('Modifications enregistrées avec succès !', 'success');
      }, 800);
    });
  });
}

/* ==========================================================================
   4. Prévisualisation d'images
   ========================================================================== */
function initImagePreview() {
  const fileInputs = document.querySelectorAll('input[type="file"][accept^="image/"]');
  
  fileInputs.forEach(input => {
    // Créer un conteneur pour l'image de prévisualisation s'il n'y en a pas
    let previewContainer = input.parentElement.querySelector('.image-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.className = 'image-preview-container';
      previewContainer.style.marginTop = '1rem';
      previewContainer.style.display = 'none';
      
      const img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '200px';
      img.style.borderRadius = 'var(--radius-sm)';
      img.style.objectFit = 'cover';
      
      previewContainer.appendChild(img);
      input.parentElement.appendChild(previewContainer);
    }

    const previewImg = previewContainer.querySelector('img');

    input.addEventListener('change', function() {
      const file = this.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          previewContainer.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
      } else {
        previewContainer.style.display = 'none';
        previewImg.src = '';
      }
    });
  });
}

/* ==========================================================================
   5. Confirmations de suppression
   ========================================================================== */
function initDeleteConfirmations() {
  const deleteButtons = document.querySelectorAll('.action-delete');
  
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.');
      if (confirmed) {
        // Simuler la suppression
        const row = e.target.closest('tr');
        if (row) {
          row.style.opacity = '0.5';
          row.style.pointerEvents = 'none';
          window.showToast('Élément supprimé', 'info');
          
          setTimeout(() => {
            row.remove();
          }, 500);
        }
      }
    });
  });
}

/* ==========================================================================
   6. Graphiques du Tableau de Bord (Chart.js)
   ========================================================================== */
function initCharts() {
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

    // Visites Chart
    const visitsCtx = document.getElementById('visitsChart');
    if (visitsCtx) {
      new Chart(visitsCtx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{
            label: 'Visiteurs uniques',
            data: [12, 19, 15, 25, 22, 30, 28],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // Interactions Chart
    const interactionsCtx = document.getElementById('interactionsChart');
    if (interactionsCtx) {
      new Chart(interactionsCtx, {
        type: 'doughnut',
        data: {
          labels: ['Messages', 'Questions Chatbot', 'Clics GitHub'],
          datasets: [{
            data: [45, 30, 25],
            backgroundColor: ['#6366f1', '#8b5cf6', '#10b981'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          cutout: '70%'
        }
      });
    }
  }
}

/* ==========================================================================
   7. Éditeur de texte riche (Quill.js)
   ========================================================================== */
function initWysiwygEditors() {
  if (typeof Quill !== 'undefined') {
    const editorConfig = {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    };

    // Éditeur pour "À propos"
    const aboutEditorEl = document.getElementById('editor-about-parcours');
    if (aboutEditorEl) {
      const quillAbout = new Quill('#editor-about-parcours', editorConfig);
      const hiddenInput = document.getElementById('about-parcours-text');
      
      quillAbout.on('text-change', function() {
        hiddenInput.value = quillAbout.root.innerHTML;
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    // Éditeur pour "Projets"
    const projectEditorEl = document.getElementById('editor-project-desc');
    if (projectEditorEl) {
      window.quillProject = new Quill('#editor-project-desc', editorConfig);
      const hiddenInput = document.getElementById('project-description');
      
      window.quillProject.on('text-change', function() {
        hiddenInput.value = window.quillProject.root.innerHTML;
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  }
}

const API_BASE = '/api';
const TOKEN_KEY = 'portfolio_admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin() {
  if (!window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
}

async function apiFetch(path, options = {}) {
  const opts = { ...options };
  opts.headers = opts.headers ? { ...opts.headers } : {};

  const token = getToken();
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`;
  }

  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    if (typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, opts);

  if (response.status === 401) {
    clearToken();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  return response;
}

async function initAuth() {
  initLoginForm();
  initRegisterForm();
  initForgotPasswordForm();
  initResetPasswordForm();

  if (!document.querySelector('.login-form') && !document.querySelector('.register-form') && !document.querySelector('.forgot-password-form') && !document.querySelector('.reset-password-form')) {
    initLogoutButtons();
    await verifyTokenAndLoadUser();
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function initRegisterForm() {
  const registerForm = document.querySelector('.register-form');
  if (!registerForm) {
    return;
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = registerForm.querySelector('#full_name').value.trim();
    const username = registerForm.querySelector('#username').value.trim();
    const email = registerForm.querySelector('#email').value.trim();
    const phone = registerForm.querySelector('#phone').value.trim();
    const password = registerForm.querySelector('#password').value;
    const confirmPassword = registerForm.querySelector('#confirm-password').value;
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (!fullName || !username || !email || !phone || !password) {
      window.showToast('Tous les champs sont requis.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      window.showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    submitBtn.textContent = 'Création...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, username, email, phone, password })
      });

      const result = await response.json();
      if (!response.ok) {
        window.showToast(result.error || 'Impossible de créer le compte administrateur.', 'error');
        return;
      }

      window.showToast('Administrateur créé avec succès. Connectez-vous maintenant.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (error) {
      console.error('Erreur création administrateur:', error);
      window.showToast('Impossible de créer le compte administrateur.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function initForgotPasswordForm() {
  const forgotForm = document.querySelector('.forgot-password-form');
  if (!forgotForm) {
    return;
  }

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = forgotForm.querySelector('#email').value.trim();
    const username = forgotForm.querySelector('#username').value.trim();
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (!email && !username) {
      window.showToast('Renseignez votre email ou votre nom d\'utilisateur.', 'error');
      return;
    }

    submitBtn.textContent = 'Envoi...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      });

      const result = await response.json();
      if (!response.ok) {
        window.showToast(result.error || 'Impossible de traiter la demande.', 'error');
        return;
      }

      if (result.resetUrl) {
        const output = document.querySelector('.reset-url-container');
        if (output) {
          output.innerHTML = `<p>Copiez ce lien pour réinitialiser votre mot de passe :</p><p><a href="${result.resetUrl}">${result.resetUrl}</a></p>`;
        }
      }

      window.showToast(result.message || 'Demande envoyée.', 'success');
    } catch (error) {
      console.error('Erreur demande mot de passe oublié:', error);
      window.showToast('Impossible de traiter la demande pour le moment.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function initResetPasswordForm() {
  const resetForm = document.querySelector('.reset-password-form');
  if (!resetForm) {
    return;
  }

  const tokenField = resetForm.querySelector('#token');
  const tokenFromUrl = getQueryParam('token');
  if (tokenField) {
    tokenField.value = tokenFromUrl || '';
  }

  if (!tokenFromUrl) {
    const tokenNotice = resetForm.querySelector('.token-notice');
    if (tokenNotice) {
      tokenNotice.classList.remove('hidden');
    }
  }

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = tokenField.value.trim();
    const password = resetForm.querySelector('#password').value;
    const confirmPassword = resetForm.querySelector('#confirm-password').value;
    const submitBtn = resetForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (!token || !password) {
      window.showToast('Token et nouveau mot de passe requis.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      window.showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    submitBtn.textContent = 'Réinitialisation...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const result = await response.json();
      if (!response.ok) {
        window.showToast(result.error || 'Impossible de réinitialiser le mot de passe.', 'error');
        return;
      }

      window.showToast(result.message || 'Mot de passe réinitialisé.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      window.showToast('Impossible de réinitialiser le mot de passe.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function initLoginForm() {
  const loginForm = document.querySelector('.login-form');
  if (!loginForm) {
    return;
  }

  if (getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = loginForm.querySelector('#username').value.trim();
    const password = loginForm.querySelector('#password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (!username || !password) {
      window.showToast('Veuillez renseigner votre nom d\'utilisateur et votre mot de passe.', 'error');
      return;
    }

    submitBtn.textContent = 'Connexion...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      if (!response.ok) {
        window.showToast(result.error || 'Erreur de connexion.', 'error');
        return;
      }

      setToken(result.token);
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Erreur login:', error);
      window.showToast('Impossible de se connecter pour le moment.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

async function verifyTokenAndLoadUser() {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await apiFetch('/auth/me');
    if (!response.ok) {
      return;
    }
    const user = await response.json();
    updateUserName(user.username);
  } catch (error) {
    console.error('Erreur vérification du token:', error);
  }
}

function updateUserName(username) {
  document.querySelectorAll('.user-name').forEach((element) => {
    element.textContent = username;
  });
}

function initLogoutButtons() {
  document.querySelectorAll('.logout-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearToken();
    });
  });
}

function initAdminPages() {
  initDashboardPage();
  initProjectsPage();
  initMessagesPage();
  initQuestionsPage();
  initSettingsPage();
  initEditHomePage();
}

function initEditHomePage() {
  const portraitInput = document.getElementById('portrait-image');
  const editForm = portraitInput ? portraitInput.closest('form') : null;
  if (!editForm) return;
  const previewContainer = document.getElementById('portrait-preview');
  let portraitUploadValid = true;
  if (portraitInput) {
    portraitInput.addEventListener('change', () => {
      const file = portraitInput.files && portraitInput.files[0];
      portraitUploadValid = true;

      if (!file) {
        if (previewContainer) previewContainer.innerHTML = '';
        return;
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        window.showToast('Type de fichier non autorisé. Utilisez jpg, png, webp, gif ou svg.', 'error');
        portraitUploadValid = false;
        portraitInput.value = '';
        if (previewContainer) previewContainer.innerHTML = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        window.showToast('Le fichier est trop volumineux. Taille max : 5MB.', 'error');
        portraitUploadValid = false;
        portraitInput.value = '';
        if (previewContainer) previewContainer.innerHTML = '';
        return;
      }

      // preview
      const reader = new FileReader();
      reader.onload = function (e) {
        if (!previewContainer) return;
        previewContainer.innerHTML = `<img src="${e.target.result}" alt="Aperçu portrait" style="max-width:200px;max-height:200px;object-fit:cover;border-radius:6px;"/>`;
      };
      reader.readAsDataURL(file);
    });
  }

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = editForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.textContent = 'Enregistrement...'; submitBtn.disabled = true; }

    try {
      const settings = {};
      // fields mapping
      const intro = document.getElementById('intro-text')?.value || '';
      const title = document.getElementById('title')?.value || '';
      const description = document.getElementById('description')?.value || '';
      if (intro) settings.home_intro = intro;
      if (title) settings.home_title = title;
      if (description) settings.home_subtitle = description;

      const file = portraitInput.files && portraitInput.files[0];
      if (file) {
        if (!portraitUploadValid) {
          window.showToast('L\'image sélectionnée est invalide. Choisissez une image valide avant de sauvegarder.', 'error');
          return;
        }

        const token = getToken();
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await fetch(`${API_BASE}/admin/upload`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: fd
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) {
          const errorMessage = uploadResult.error || 'Échec upload image';
          window.showToast(errorMessage, 'error');
          return;
        }
        settings.hero_image = uploadResult.url;
      }

      const response = await apiFetch('/admin/settings', { method: 'PUT', body: { settings } });
      if (!response.ok) {
        const r = await response.json();
        throw new Error(r.error || 'Erreur sauvegarde');
      }

      window.showToast('Page d\'accueil mise à jour.', 'success');
    } catch (error) {
      console.error('Erreur édition page accueil:', error);
      window.showToast(error.message || 'Impossible d\'enregistrer les modifications.', 'error');
    } finally {
      if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function initDashboardPage() {
  const kpiNumbers = document.querySelectorAll('.kpi-number');
  if (!kpiNumbers.length) {
    return;
  }

  try {
    const [projectsRes, messagesRes, questionsRes] = await Promise.all([
      apiFetch('/admin/projects'),
      apiFetch('/admin/messages'),
      apiFetch('/admin/chatbot-questions')
    ]);

    const [projects, messages, questions] = await Promise.all([
      projectsRes.json(),
      messagesRes.json(),
      questionsRes.json(),
    ]);

    kpiNumbers[0].textContent = projects.length;
    kpiNumbers[1].textContent = messages.length;
    kpiNumbers[2].textContent = questions.length;
    kpiNumbers[3].textContent = projects.length;
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

async function initProjectsPage() {
  const projectTableBody = document.getElementById('project-table-body');
  const projectForm = document.getElementById('project-form');
  if (!projectTableBody || !projectForm) {
    return;
  }

  const titleInput = document.getElementById('project-name');
  const descriptionInput = document.getElementById('project-description');
  const technologiesInput = document.getElementById('project-technologies');
  const githubInput = document.getElementById('project-github');
  const projectIdInput = document.getElementById('project-id');
  const submitBtn = projectForm.querySelector('button[type="submit"]');
  let editingProjectId = null;

  async function loadProjects() {
    try {
      const response = await apiFetch('/admin/projects');
      const projects = await response.json();

      if (!projects.length) {
        projectTableBody.innerHTML = '<tr><td colspan="5">Aucun projet trouvé.</td></tr>';
        return;
      }

      projectTableBody.innerHTML = projects.map((project) => `
        <tr data-project-id="${project.id}">
          <td>${escapeHtml(project.title)}</td>
          <td>${escapeHtml(project.description)}</td>
          <td>${escapeHtml(project.technologies)}</td>
          <td>${project.github_link ? `<a href="${escapeHtml(project.github_link)}" target="_blank" rel="noreferrer">Lien</a>` : '<span>-</span>'}</td>
          <td>
            <a href="#" class="action-edit" data-project-id="${project.id}">Éditer</a>
            <a href="#" class="action-delete" data-project-id="${project.id}">Supprimer</a>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Erreur chargement projets admin:', error);
      projectTableBody.innerHTML = '<tr><td colspan="5">Impossible de charger les projets.</td></tr>';
    }
  }

  projectTableBody.addEventListener('click', async (event) => {
    const editButton = event.target.closest('.action-edit');
    const deleteButton = event.target.closest('.action-delete');

    if (!editButton && !deleteButton) {
      return;
    }

    event.preventDefault();
    const projectId = editButton ? editButton.dataset.projectId : deleteButton.dataset.projectId;
    if (!projectId) {
      return;
    }

    if (editButton) {
      try {
        const response = await apiFetch(`/admin/projects`);
        const projects = await response.json();
        const project = projects.find((item) => item.id === Number(projectId));
        if (!project) {
          window.showToast('Projet introuvable.', 'error');
          return;
        }

        editingProjectId = project.id;
        projectIdInput.value = project.id;
        titleInput.value = project.title || '';
        descriptionInput.value = project.description || '';
        if (window.quillProject) {
          window.quillProject.root.innerHTML = project.description || '';
        }
        technologiesInput.value = project.technologies || '';
        githubInput.value = project.github_link || '';
        submitBtn.textContent = 'Mettre à jour le projet';
        window.scrollTo({ top: projectForm.offsetTop - 20, behavior: 'smooth' });
      } catch (error) {
        console.error('Erreur récupération projet pour édition:', error);
        window.showToast('Impossible de charger le projet.', 'error');
      }
    }

    if (deleteButton) {
      const confirmed = confirm('Voulez-vous vraiment supprimer ce projet ?');
      if (!confirmed) {
        return;
      }

      try {
        const response = await apiFetch(`/admin/projects/${projectId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const json = await response.json();
          throw new Error(json.error || 'Erreur suppression projet');
        }

        window.showToast('Projet supprimé avec succès.', 'success');
        loadProjects();
      } catch (error) {
        console.error('Erreur suppression projet admin:', error);
        window.showToast('Impossible de supprimer le projet.', 'error');
      }
    }
  });

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const technologies = technologiesInput.value.trim();
    const github_link = githubInput.value.trim();
    const image_url = '';
    const payload = {
      title,
      description,
      technologies,
      github_link,
      image_url,
      display_order: 0
    };

    if (!title || !description || !technologies) {
      window.showToast('Veuillez renseigner le titre, la description et les technologies.', 'error');
      return;
    }

    submitBtn.textContent = editingProjectId ? 'Enregistrement...' : 'Création...';
    submitBtn.disabled = true;

    try {
      const method = editingProjectId ? 'PUT' : 'POST';
      const path = editingProjectId ? `/admin/projects/${editingProjectId}` : '/admin/projects';

      const response = await apiFetch(path, {
        method,
        body: payload
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erreur de sauvegarde.');
      }

      window.showToast(editingProjectId ? 'Projet mis à jour.' : 'Projet créé.', 'success');
      projectForm.reset();
      if (window.quillProject) {
        window.quillProject.root.innerHTML = '';
      }
      projectIdInput.value = '';
      editingProjectId = null;
      submitBtn.textContent = 'Enregistrer le projet';
      loadProjects();
    } catch (error) {
      console.error('Erreur sauvegarde projet admin:', error);
      window.showToast('Impossible d\'enregistrer le projet.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadProjects();
}

async function initMessagesPage() {
  const messagesList = document.querySelector('.messages-list');
  const emptyState = document.querySelector('.empty-state');
  if (!messagesList) {
    return;
  }

  async function loadMessages() {
    try {
      const response = await apiFetch('/admin/messages');
      const messages = await response.json();

      if (!messages.length) {
        messagesList.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'block';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      messagesList.innerHTML = messages.map((message) => `
        <article class="message-item ${message.is_read ? 'read' : 'unread'}" data-message-id="${message.id}">
          <header class="message-header">
            <h3>${escapeHtml(message.subject || `Message de ${message.name}`)}</h3>
            <span class="message-status">${message.is_read ? 'Lu' : 'Non lu'}</span>
          </header>
          <div class="message-body">
            <p><strong>De :</strong> ${escapeHtml(message.name)} (${escapeHtml(message.email)})</p>
            <p><strong>Contenu :</strong> ${escapeHtml(message.content)}</p>
            <p><strong>Date :</strong> ${new Date(message.created_at).toLocaleString('fr-FR')}</p>
          </div>
          <footer class="message-actions">
            <a href="#" class="action-mark-read">${message.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}</a>
            <a href="#" class="action-delete">Supprimer</a>
          </footer>
        </article>
      `).join('');
    } catch (error) {
      console.error('Erreur chargement messages admin:', error);
      messagesList.innerHTML = '<p>Impossible de charger les messages.</p>';
    }
  }

  messagesList.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.action-delete');
    const markReadButton = event.target.closest('.action-mark-read');
    if (!deleteButton && !markReadButton) {
      return;
    }

    event.preventDefault();
    const article = event.target.closest('.message-item');
    if (!article) {
      return;
    }

    const messageId = article.dataset.messageId;
    if (!messageId) {
      return;
    }

    if (deleteButton) {
      if (!confirm('Voulez-vous vraiment supprimer ce message ?')) {
        return;
      }

      try {
        const response = await apiFetch(`/admin/messages/${messageId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Erreur suppression message');
        }
        window.showToast('Message supprimé.', 'success');
        loadMessages();
      } catch (error) {
        console.error('Erreur suppression message admin:', error);
        window.showToast('Impossible de supprimer le message.', 'error');
      }
      return;
    }

    if (markReadButton) {
      try {
        const isRead = article.classList.contains('unread');
        const response = await apiFetch(`/admin/messages/${messageId}/read`, {
          method: 'PUT',
          body: { is_read: isRead }
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Erreur mise à jour message');
        }
        window.showToast('Statut du message mis à jour.', 'success');
        loadMessages();
      } catch (error) {
        console.error('Erreur mise à jour message admin:', error);
        window.showToast('Impossible de mettre à jour le message.', 'error');
      }
    }
  });

  loadMessages();
}

async function initQuestionsPage() {
  const questionsTableBody = document.querySelector('.questions-table tbody');
  if (!questionsTableBody) {
    return;
  }

  async function loadQuestions() {
    try {
      const response = await apiFetch('/admin/chatbot-questions');
      const questions = await response.json();
      if (!questions.length) {
        questionsTableBody.innerHTML = '<tr><td colspan="6">Aucune question trouvée.</td></tr>';
        return;
      }

      questionsTableBody.innerHTML = questions.map((question) => `
        <tr data-question-id="${question.id}">
          <td>${escapeHtml(question.question)}</td>
          <td>${escapeHtml(question.answer)}</td>
          <td>${question.is_active ? 'Active' : 'Inactive'}</td>
          <td>${new Date(question.created_at).toLocaleDateString('fr-FR')}</td>
          <td>${question.is_active ? 'Actif' : 'Inactif'}</td>
          <td>
            <a href="#" class="action-delete" data-question-id="${question.id}">Supprimer</a>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Erreur chargement questions admin:', error);
      questionsTableBody.innerHTML = '<tr><td colspan="6">Impossible de charger les questions.</td></tr>';
    }
  }

  questionsTableBody.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.action-delete');
    if (!deleteButton) {
      return;
    }

    event.preventDefault();
    const questionId = deleteButton.dataset.questionId;
    if (!questionId) {
      return;
    }

    if (!confirm('Voulez-vous vraiment supprimer cette question ?')) {
      return;
    }

    try {
      const response = await apiFetch(`/admin/chatbot-questions/${questionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erreur suppression question');
      }
      window.showToast('Question supprimée.', 'success');
      loadQuestions();
    } catch (error) {
      console.error('Erreur suppression question admin:', error);
      window.showToast('Impossible de supprimer la question.', 'error');
    }
  });

  loadQuestions();
}

async function initSettingsPage() {
  const siteSettingsForm = document.getElementById('site-settings-form');
  const integrationSettingsForm = document.getElementById('integration-settings-form');
  const profileSettingsForm = document.getElementById('profile-settings-form');
  if (!siteSettingsForm && !integrationSettingsForm && !profileSettingsForm) {
    return;
  }

  const fieldIds = [
    'site-title',
    'site-description',
    'site-language',
    'maintenance-mode',
    'analytics-id',
    'smtp-host',
    'admin-name',
    'admin-email',
    'admin-username'
  ];

  try {
    const response = await apiFetch('/admin/settings');
    const settings = await response.json();
    fieldIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && settings[element.name]) {
        element.value = settings[element.name];
      }
    });

    const usernameField = document.getElementById('admin-username');
    if (usernameField && !usernameField.value) {
      const token = getToken();
      if (token) {
        verifyTokenAndLoadUser();
      }
    }
  } catch (error) {
    console.error('Erreur chargement paramètres admin:', error);
  }

  if (siteSettingsForm) {
    siteSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const settings = {
        site_title: document.getElementById('site-title')?.value || '',
        site_description: document.getElementById('site-description')?.value || '',
        site_language: document.getElementById('site-language')?.value || '',
        maintenance_mode: document.getElementById('maintenance-mode')?.value || ''
      };

      try {
        const response = await apiFetch('/admin/settings', {
          method: 'PUT',
          body: { settings }
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Erreur mise à jour paramètres');
        }
        window.showToast('Paramètres du site enregistrés.', 'success');
      } catch (error) {
        console.error('Erreur enregistrement paramètres:', error);
        window.showToast('Impossible d\'enregistrer les paramètres.', 'error');
      }
    });
  }

  if (integrationSettingsForm) {
    integrationSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const settings = {
        analytics_id: document.getElementById('analytics-id')?.value || '',
        smtp_host: document.getElementById('smtp-host')?.value || ''
      };

      try {
        const response = await apiFetch('/admin/settings', {
          method: 'PUT',
          body: { settings }
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Erreur mise à jour intégrations');
        }
        window.showToast('Paramètres d\'intégration mis à jour.', 'success');
      } catch (error) {
        console.error('Erreur enregistrement intégrations:', error);
        window.showToast('Impossible d\'enregistrer les intégrations.', 'error');
      }
    });
  }

  if (profileSettingsForm) {
    profileSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('admin-username')?.value.trim();
      const password = document.getElementById('admin-password')?.value;
      const email = document.getElementById('admin-email')?.value || '';
      const name = document.getElementById('admin-name')?.value || '';

      if (!username && !password && !email && !name) {
        window.showToast('Veuillez saisir au moins une information à mettre à jour.', 'error');
        return;
      }

      try {
        if (username || password) {
          const response = await apiFetch('/admin/profile', {
            method: 'PUT',
            body: { username, password }
          });
          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Erreur mise à jour profil');
          }
        }

        const settingsPayload = {};
        if (name) settingsPayload.admin_name = name;
        if (email) settingsPayload.admin_email = email;

        if (Object.keys(settingsPayload).length) {
          const response = await apiFetch('/admin/settings', {
            method: 'PUT',
            body: { settings: settingsPayload }
          });
          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Erreur enregistrement des informations');
          }
        }

        window.showToast('Profil administrateur mis à jour.', 'success');
      } catch (error) {
        console.error('Erreur modification profil admin:', error);
        window.showToast('Impossible de mettre à jour votre profil.', 'error');
      }
    });
  }
}
