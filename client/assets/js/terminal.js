// ===== COMMAND PALETTE / TERMINAL =====
class CommandPalette {
  constructor() {
    this.palette = document.getElementById('commandPalette');
    this.input = document.getElementById('commandInput');
    this.results = document.getElementById('commandResults');
    this.cmdBtn = document.getElementById('cmdBtn');
    this.isOpen = false;
    
    this.commands = [
      {
        name: 'Home',
        description: 'Go to home section',
        action: () => this.navigateTo('#home'),
        icon: '🏠'
      },
      {
        name: 'About',
        description: 'Learn more about me',
        action: () => this.navigateTo('#about'),
        icon: '👤'
      },
      {
        name: 'Projects',
        description: 'View my projects',
        action: () => this.navigateTo('#projects'),
        icon: '🚀'
      },
      {
        name: 'Skills',
        description: 'See my technical skills',
        action: () => this.navigateTo('#skills'),
        icon: '💻'
      },
      {
        name: 'Contact',
        description: 'Get in touch',
        action: () => this.navigateTo('#contact'),
        icon: '📧'
      },
      {
        name: 'Blog',
        description: 'Read my blog posts',
        action: () => this.navigateTo('#blog'),
        icon: '📝'
      },
      {
        name: 'Toggle Theme',
        description: 'Switch between dark and light mode',
        action: () => themeManager.toggleTheme(),
        icon: '🎨'
      },
      {
        name: 'Open Chat',
        description: 'Open the chat widget',
        action: () => chatWidget.openChat(),
        icon: '💬'
      },
      {
        name: 'Download Resume',
        description: 'Download my resume (PDF)',
        action: () => window.open('./assets/documents/resume.pdf', '_blank'),
        icon: '📄'
      },
      {
        name: 'GitHub',
        description: 'Visit my GitHub profile',
        action: () => window.open('https://github.com/geeooh25', '_blank'),
        icon: '🐙'
      },
      {
        name: 'LinkedIn',
        description: 'Connect on LinkedIn',
        action: () => window.open('https://linkedin.com/in/geeooh', '_blank'),
        icon: '💼'
      },
      {
        name: 'Clear',
        description: 'Clear the terminal',
        action: () => this.clearResults(),
        icon: '🧹'
      }
    ];

    this.init();
  }

  init() {
    // Open with Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      
      // Close with Escape
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Button click
    if (this.cmdBtn) {
      this.cmdBtn.addEventListener('click', () => this.toggle());
    }

    // Input handler
    if (this.input) {
      this.input.addEventListener('input', () => this.filterCommands());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.executeFirstCommand();
        }
      });
    }

    // Close on overlay click
    const overlay = this.palette?.querySelector('.command-palette-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.palette) return;
    
    this.palette.style.display = 'block';
    this.isOpen = true;
    
    // Show all commands initially
    this.showCommands(this.commands);
    
    // Focus input
    setTimeout(() => {
      this.input?.focus();
    }, 100);

    // Add animation
    this.palette.classList.add('open');
  }

  close() {
    if (!this.palette) return;
    
    this.palette.classList.remove('open');
    
    setTimeout(() => {
      this.palette.style.display = 'none';
    }, 200);
    
    this.isOpen = false;
    
    // Clear input
    if (this.input) this.input.value = '';
  }

  filterCommands() {
    const query = this.input?.value.toLowerCase() || '';
    
    if (!query) {
      this.showCommands(this.commands);
      return;
    }

    const filtered = this.commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
    );

    this.showCommands(filtered);
  }

  showCommands(commands) {
    if (!this.results) return;

    this.results.innerHTML = '';

    if (commands.length === 0) {
      this.results.innerHTML = `
        <div class="command-empty">
          <span>🔍</span>
          <p>No commands found</p>
        </div>
      `;
      return;
    }

    commands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = `command-item ${index === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <span class="command-icon">${cmd.icon}</span>
        <div class="command-info">
          <span class="command-name">${cmd.name}</span>
          <span class="command-desc">${cmd.description}</span>
        </div>
        <kbd class="command-shortcut">↵</kbd>
      `;
      
      item.addEventListener('click', () => {
        cmd.action();
        this.close();
      });

      this.results.appendChild(item);
    });
  }

  executeFirstCommand() {
    const firstItem = this.results?.querySelector('.command-item');
    if (firstItem) {
      firstItem.click();
    }
  }

  navigateTo(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  clearResults() {
    if (this.input) this.input.value = '';
    this.showCommands(this.commands);
  }
}

// Initialize command palette
const commandPalette = new CommandPalette();

// ===== DEVELOPER TERMINAL =====
class DevTerminal {
  constructor() {
    this.terminal = null;
    this.output = null;
    this.input = null;
    this.history = [];
    this.historyIndex = -1;
    
    this.commands = {
      help: () => this.showHelp(),
      about: () => this.showAbout(),
      skills: () => this.showSkills(),
      projects: () => this.showProjects(),
      contact: () => this.showContact(),
      clear: () => this.clear(),
      theme: (args) => this.changeTheme(args),
      date: () => new Date().toString(),
      whoami: () => 'Ganiyu Usman - Fullstack Developer',
      github: () => this.openLink('https://github.com/geeooh25'),
      linkedin: () => this.openLink('https://linkedin.com/in/geeooh'),
      cv: () => this.openLink('./assets/documents/resume.pdf'),
      echo: (args) => args.join(' '),
    };
  }

  init() {
    // Create terminal if it exists in DOM
    this.terminal = document.getElementById('devTerminal');
    if (!this.terminal) return;

    this.output = this.terminal.querySelector('.terminal-output');
    this.input = this.terminal.querySelector('.terminal-input input');

    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.execute(this.input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Initial message
    this.print('Welcome to GEEOOH Terminal. Type "help" for available commands.', 'info');
  }

  execute(commandStr) {
    if (!commandStr.trim()) return;

    // Add to history
    this.history.push(commandStr);
    this.historyIndex = this.history.length;

    // Display command
    this.print(`$ ${commandStr}`, 'command');

    // Parse command and arguments
    const [cmd, ...args] = commandStr.trim().split(' ');

    // Execute command
    if (this.commands[cmd]) {
      try {
        const result = this.commands[cmd](args);
        if (result) {
          this.print(result, 'output');
        }
      } catch (error) {
        this.print(`Error: ${error.message}`, 'error');
      }
    } else {
      this.print(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
    }

    // Clear input
    if (this.input) this.input.value = '';
  }

  print(message, type = 'output') {
    if (!this.output) return;

    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerHTML = message;
    this.output.appendChild(line);

    // Scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }

  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;
    
    if (newIndex >= 0 && newIndex <= this.history.length) {
      this.historyIndex = newIndex;
      
      if (this.input) {
        this.input.value = this.historyIndex === this.history.length 
          ? '' 
          : this.history[this.historyIndex];
      }
    }
  }

  showHelp() {
    return `
      <strong>Available Commands:</strong><br>
      <span class="cmd">help</span> - Show this help<br>
      <span class="cmd">about</span> - About me<br>
      <span class="cmd">skills</span> - My technical skills<br>
      <span class="cmd">projects</span> - Featured projects<br>
      <span class="cmd">contact</span> - Contact information<br>
      <span class="cmd">clear</span> - Clear terminal<br>
      <span class="cmd">theme [dark|light]</span> - Change theme<br>
      <span class="cmd">date</span> - Current date/time<br>
      <span class="cmd">whoami</span> - Who I am<br>
      <span class="cmd">github</span> - Open GitHub<br>
      <span class="cmd">linkedin</span> - Open LinkedIn<br>
      <span class="cmd">cv</span> - Download resume<br>
      <span class="cmd">echo [text]</span> - Echo text
    `;
  }

  showAbout() {
    return `
      <strong>Ganiyu Usman</strong><br>
      Fullstack Developer<br>
      Building scalable applications with Node.js, JavaScript, and modern web technologies.<br>
      2+ years of experience crafting premium digital experiences.
    `;
  }

  showSkills() {
    return `
      <strong>Technical Skills:</strong><br>
      • Frontend: HTML5, CSS3, JavaScript, Bootstrap<br>
      • Backend: Node.js, Express.js<br>
      • Database: MongoDB, SQL, PostgreSQL<br>
      • Tools: Git, GitHub, RESTful APIs<br>
      • Other: Responsive Design, EJS
    `;
  }

  showProjects() {
    return `
      <strong>Featured Projects:</strong><br>
      1. Beedaht Treats - E-commerce platform<br>
      2. Multi-Currency Bank - Banking interface<br>
      3. Social Media App - Social management tool<br>
      4. Hotel Management System - Full-stack booking system<br><br>
      Visit <a href="#projects" style="color: var(--accent-primary)">projects section</a> for more details.
    `;
  }

  showContact() {
    return `
      <strong>Contact Information:</strong><br>
      📧 Email: ganiyuusman43@gmail.com<br>
      📱 Phone: +234 903 659 6606<br>
      💼 LinkedIn: linkedin.com/in/geeooh<br>
      🐙 GitHub: github.com/geeooh25
    `;
  }

  changeTheme(args) {
    const theme = args[0];
    if (theme === 'dark' || theme === 'light') {
      themeManager.setTheme(theme);
      return `Theme changed to ${theme} mode.`;
    }
    return 'Usage: theme [dark|light]';
  }

  openLink(url) {
    window.open(url, '_blank');
    return `Opening ${url}...`;
  }

  clear() {
    if (this.output) this.output.innerHTML = '';
  }
}

// Initialize dev terminal if it exists
const devTerminal = new DevTerminal();
devTerminal.init();