/**
 * Logique du Chatbot
 * Nommé "Diane"
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Création de l'interface HTML du Chatbot dynamiquement ---
  const chatbotHTML = `
    <!-- Bouton flottant -->
    <div class="chatbot-toggle" id="chatbot-toggle" aria-label="Ouvrir le chat avec Diane">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>

    <!-- Conteneur de la discussion -->
    <div class="chatbot-container" id="chatbot-container">
      <div class="chatbot-header">
        <div class="chatbot-header-info">
          <div class="chatbot-avatar">D</div>
          <div>
            <h3 class="chatbot-title">Diane</h3>
            <span class="chatbot-status">En ligne</span>
          </div>
        </div>
        <button class="chatbot-close" id="chatbot-close" aria-label="Fermer le chat">&times;</button>
      </div>

      <div class="chatbot-body" id="chatbot-body">
        <!-- Message de bienvenue -->
        <div class="chat-message bot">
          Bonjour ! Je suis Diane, votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?
          <span class="chat-timestamp">${getFormattedTime()}</span>
        </div>
      </div>

      <div class="chatbot-footer">
        <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Écrivez votre message..." autocomplete="off">
        <button class="chatbot-send" id="chatbot-send" aria-label="Envoyer">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;

  // Injection du HTML à la fin du body
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);

  // --- Sélecteurs ---
  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const container = document.getElementById('chatbot-container');
  const sendBtn = document.getElementById('chatbot-send');
  const inputField = document.getElementById('chatbot-input');
  const chatBody = document.getElementById('chatbot-body');

  // --- Gestion de l'ouverture / fermeture ---
  toggleBtn.addEventListener('click', () => {
    container.classList.add('active');
    inputField.focus();
    // Cache le bouton s'il est au dessus (facultatif)
    toggleBtn.style.transform = 'scale(0)';
  });

  closeBtn.addEventListener('click', () => {
    container.classList.remove('active');
    toggleBtn.style.transform = 'scale(1)';
  });

  // --- Envoi de messages ---
  function sendMessage() {
    const text = inputField.value.trim();
    if (text === '') return;

    // Ajouter message utilisateur
    addMessage(text, 'user');
    inputField.value = '';

    // Scroll en bas
    scrollToBottom();

    // Simuler la réponse de "Diane"
    simulateBotResponse();
  }

  sendBtn.addEventListener('click', sendMessage);
  
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // --- Fonctions utilitaires ---
  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-message', sender);
    msgDiv.innerHTML = `
      ${text}
      <span class="chat-timestamp">${getFormattedTime()}</span>
    `;
    chatBody.appendChild(msgDiv);
    scrollToBottom();
  }

  function simulateBotResponse() {
    // Ajouter l'indicateur de frappe
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('chat-message', 'bot', 'typing-indicator');
    typingDiv.id = typingId;
    typingDiv.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatBody.appendChild(typingDiv);
    scrollToBottom();

    // Retirer l'indicateur et afficher la vraie réponse après 1.5s
    setTimeout(() => {
      document.getElementById(typingId).remove();
      
      const responses = [
        "C'est noté ! Je transmettrai cette information.",
        "Avez-vous besoin d'autres détails concernant mes projets ou mon parcours ?",
        "Je suis un prototype de chatbot, mais bientôt je serai connecté à une vraie intelligence artificielle pour mieux vous répondre !",
        "N'hésitez pas à utiliser le formulaire de contact classique si votre demande est urgente."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      addMessage(randomResponse, 'bot');
    }, 1500);
  }

  function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
});
