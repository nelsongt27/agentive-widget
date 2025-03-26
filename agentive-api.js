// Archivo: agentive-api.js
class AgentiveChat {
  constructor(containerId, apiKey, assistantId) {
    this.container = document.getElementById(containerId);
    this.apiKey = apiKey;
    this.assistantId = assistantId;
    this.sessionId = null;
    this.messageHistory = [];
    this.init();
  }

  async init() {
    this.renderChatInterface();
    await this.createSession();
  }

  renderChatInterface() {
    // Crear interfaz básica del chat
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); background: white;">
        <div style="background: #3a6ad4; color: white; padding: 15px; display: flex; align-items: center;">
          <div style="margin-left: 10px;">
            <div style="font-weight: bold; font-size: 16px;">Ghostwriting assistant</div>
            <div style="font-size: 12px;">● Online</div>
          </div>
        </div>
        <div id="messages" style="flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;"></div>
        <div style="padding: 10px; border-top: 1px solid #eee; display: flex;">
          <input id="user-input" type="text" placeholder="Escribe un mensaje..." 
                 style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none;">
          <button id="send-button" style="background: #3a6ad4; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; margin-left: 10px; cursor: pointer;">
            ➤
          </button>
        </div>
      </div>
    `;

    // Agregar evento para enviar mensaje
    document.getElementById('send-button').addEventListener('click', () => this.sendMessage());
    document.getElementById('user-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Añadir mensaje inicial del sistema
    this.addMessage({
      role: 'assistant',
      content: 'Eres un asistente especializado en crear contenido viral para consultores y proveedores de servicios profesionales. ¿Cómo puedo ayudarte hoy?'
    });
  }

  async createSession() {
    try {
      const response = await fetch('https://agentivehub.com/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          assistant_id: this.assistantId
        })
      });
      
      const data = await response.json();
      
      if (data.session_id) {
        this.sessionId = data.session_id;
        console.log('Sesión creada:', this.sessionId);
      } else {
        console.error('Error al crear sesión:', data);
        this.addMessage({
          role: 'system',
          content: 'Error al conectar con el asistente. Por favor, inténtalo de nuevo más tarde.'
        });
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      this.addMessage({
        role: 'system',
        content: 'Error de conexión. Por favor, verifica tu internet e inténtalo de nuevo.'
      });
    }
  }

  async sendMessage() {
    const inputElement = document.getElementById('user-input');
    const message = inputElement.value.trim();
    
    if (!message || !this.sessionId) return;
    
    // Limpiar input
    inputElement.value = '';
    
    // Añadir mensaje del usuario a la interfaz
    this.addMessage({
      role: 'user',
      content: message
    });
    
    // Mostrar indicador de "escribiendo..."
    const typingId = this.addMessage({
      role: 'assistant',
      content: 'Escribiendo...',
      isTyping: true
    });
    
    try {
      const response = await fetch('https://agentivehub.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          session_id: this.sessionId,
          type: 'custom_code',
          assistant_id: this.assistantId,
          messages: [{ role: 'user', content: message }]
        })
      });
      
      const data = await response.json();
      
      // Eliminar indicador de escribiendo
      this.removeMessage(typingId);
      
      if (data.response) {
        // Añadir respuesta del asistente
        this.addMessage({
          role: 'assistant',
          content: data.response
        });
      } else {
        console.error('Error en la respuesta:', data);
        this.addMessage({
          role: 'system',
          content: 'Error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
        });
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      this.removeMessage(typingId);
      this.addMessage({
        role: 'system',
        content: 'Error de conexión. Por favor, verifica tu internet e inténtalo de nuevo.'
      });
    }
  }

  addMessage({ role, content, isTyping = false }) {
    const messagesContainer = document.getElementById('messages');
    const messageId = Date.now().toString();
    
    const messageElement = document.createElement('div');
    messageElement.id = `msg-${messageId}`;
    messageElement.style.maxWidth = '80%';
    messageElement.style.padding = '10px 15px';
    messageElement.style.borderRadius = '18px';
    messageElement.style.marginBottom = '8px';
    
    if (role === 'user') {
      messageElement.style.alignSelf = 'flex-end';
      messageElement.style.background = '#e1f5fe';
    } else if (role === 'assistant') {
      messageElement.style.alignSelf = 'flex-start';
      messageElement.style.background = '#f5f5f5';
    } else {
      messageElement.style.alignSelf = 'center';
      messageElement.style.background = '#fff3e0';
      messageElement.style.fontSize = '12px';
    }
    
    messageElement.innerHTML = isTyping 
      ? '<div style="display: flex; gap: 3px;"><span>.</span><span>.</span><span>.</span></div>'
      : content;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
  }
  
  removeMessage(id) {
    const messageElement = document.getElementById(`msg-${id}`);
    if (messageElement) {
      messageElement.remove();
    }
  }
}
