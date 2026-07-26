// ===== CHAT WIDGET =====
class ChatWidget {
  constructor() {
    this.widget = document.getElementById('chatWidget');
    this.toggleBtn = document.getElementById('chatToggle');
    this.window = document.getElementById('chatWindow');
    this.closeBtn = document.getElementById('chatClose');
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.badge = document.getElementById('chatBadge');
    
    this.conversationId = localStorage.getItem('chat_conversation_id') || this.generateConversationId();
    this.isOpen = false;
    this.socket = null;
    this.unreadCount = 0;
    this.socketConnected = false;
    
    this.init();
  }

  init() {
    // Save conversation ID
    localStorage.setItem('chat_conversation_id', this.conversationId);

    // Toggle chat window
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleChat());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeChat());
    }

    // Send message on button click
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Send message on Enter key
    if (this.input) {
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    // Initialize Socket.IO (only if available)
    this.initSocket();
  }

  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  initSocket() {
    // Check if Socket.IO is available
    if (typeof io === 'undefined') {
      console.log('Socket.IO not loaded - chat will work via API only');
      this.socketConnected = false;
      return;
    }

    try {
      // Connect to Socket.IO server
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Chat socket connected');
        this.socketConnected = true;
        
        // Join conversation room
        this.socket.emit('user-join', {
          conversationId: this.conversationId,
          role: 'visitor'
        });
      });

      this.socket.on('connect_error', (error) => {
        console.log('Socket connection error - chat will use API fallback');
        this.socketConnected = false;
      });

      // Listen for new messages
      this.socket.on('new-message', (message) => {
        if (message.sender?.email !== 'admin') {
          this.addMessage(message, 'user');
        }
      });

      // Listen for admin replies
      this.socket.on('admin-reply', (data) => {
        this.addMessage({
          content: data.replyContent || data.message?.content || 'Thank you for your message!',
          sender: { name: 'Ganiyu Usman' }
        }, 'admin');
        
        // Update badge if chat is closed
        if (!this.isOpen) {
          this.unreadCount++;
          this.updateBadge();
        }
      });

      // Typing indicator
      this.socket.on('user-typing', (data) => {
        if (data.isTyping) {
          this.showTypingIndicator(data.name);
        } else {
          this.hideTypingIndicator();
        }
      });

      this.socket.on('message-error', (error) => {
        console.error('Message error:', error);
        this.showError('Failed to send message. Please try again.');
      });

      this.socket.on('disconnect', () => {
        console.log('Chat socket disconnected');
        this.socketConnected = false;
      });

    } catch (error) {
      console.log('Failed to initialize socket:', error.message);
      this.socketConnected = false;
    }
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    if (!this.window) return;
    this.window.classList.add('open');
    this.isOpen = true;
    this.unreadCount = 0;
    this.updateBadge();
    
    // Focus input
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 300);

    // Scroll to bottom
    this.scrollToBottom();
  }

  closeChat() {
    if (!this.window) return;
    this.window.classList.remove('open');
    this.isOpen = false;
  }

  sendMessage() {
    const content = this.input?.value.trim();
    if (!content) return;

    // Add message to UI immediately
    const messageData = {
      content,
      sender: { name: 'You' },
      timestamp: new Date()
    };
    this.addMessage(messageData, 'user');

    // Send via Socket.IO if connected
    if (this.socketConnected && this.socket) {
      this.socket.emit('send-message', {
        conversationId: this.conversationId,
        sender: {
          name: 'Website Visitor',
          email: 'visitor@website.com'
        },
        content
      });
    }

    // Also save via API as fallback
    this.saveMessageViaAPI(content);

    // Clear input
    if (this.input) this.input.value = '';
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  async saveMessageViaAPI(content) {
    try {
      if (typeof api !== 'undefined') {
        await api.sendContactMessage({
          name: 'Website Visitor',
          email: 'visitor@website.com',
          content,
          conversationId: this.conversationId
        });
      }
    } catch (error) {
      console.log('Failed to save message via API:', error.message);
    }
  }

  addMessage(message, type) {
    if (!this.messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;
    
    const time = message.timestamp 
      ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.innerHTML = `
      <div class="message-bubble">
        <div class="message-content">${this.formatMessage(message.content)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  formatMessage(content) {
    if (!content) return '';
    // Basic formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator(name) {
    this.hideTypingIndicator();

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="typing-text">${name} is typing...</span>
    `;
    this.messagesContainer?.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  showError(message) {
    if (!this.messagesContainer) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'chat-error';
    errorElement.textContent = message;
    this.messagesContainer.appendChild(errorElement);
    
    setTimeout(() => {
      errorElement.remove();
    }, 3000);
  }

  updateBadge() {
    if (!this.badge) return;
    
    if (this.unreadCount > 0) {
      this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
    }
  }

  scrollToBottom() {
    if (!this.messagesContainer) return;
    
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }
}

// Initialize chat widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatWidget = new ChatWidget();
});