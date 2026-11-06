// ===== API CONFIGURATION =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api/v1',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// ===== API HELPER CLASS =====
class PortfolioAPI {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = JSON.parse(localStorage.getItem('auth_user') || 'null');
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic fetch with retry
  async fetchAPI(endpoint, options = {}, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (error.name === 'AbortError' && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        return this.fetchAPI(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const data = await this.fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.success) {
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return data;
  }

  async register(formData) {
    const data = await this.fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    return data;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/pages/admin/login.html';
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    return this.user;
  }

  // Public API endpoints
  async getPublicProjects() {
    return this.fetchAPI('/public/projects');
  }

  async getPublicProject(slug) {
    return this.fetchAPI(`/public/projects/${slug}`);
  }

  async getFeaturedProjects() {
    return this.fetchAPI('/public/projects/featured');
  }

  async getPublicBlogs(page = 1, limit = 10) {
    return this.fetchAPI(`/public/blogs?page=${page}&limit=${limit}`);
  }

  async getPublicBlog(slug) {
    return this.fetchAPI(`/public/blogs/${slug}`);
  }

  async getSkills() {
    return this.fetchAPI('/public/skills');
  }

  async getExperiences() {
    return this.fetchAPI('/public/experiences');
  }

  async getTestimonials() {
    return this.fetchAPI('/public/testimonials');
  }

  async getSettings() {
    return this.fetchAPI('/public/settings');
  }

  async sendContactMessage(formData) {
    return this.fetchAPI('/public/contact', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  async searchSite(query) {
    return this.fetchAPI(`/public/search?q=${encodeURIComponent(query)}`);
  }

  // Admin API endpoints
  async getAdminStats() {
    return this.fetchAPI('/admin/stats');
  }

  // Projects CRUD
  async getProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetchAPI(`/projects${queryString ? '?' + queryString : ''}`);
  }

  async getProject(id) {
    return this.fetchAPI(`/projects/${id}`);
  }

  async createProject(projectData) {
    return this.fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(id, projectData) {
    return this.fetchAPI(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id) {
    return this.fetchAPI(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // Blog CRUD
  async getBlogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetchAPI(`/blogs${queryString ? '?' + queryString : ''}`);
  }

  async getBlog(id) {
    return this.fetchAPI(`/blogs/${id}`);
  }

  async createBlog(blogData) {
    return this.fetchAPI('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData)
    });
  }

  async updateBlog(id, blogData) {
    return this.fetchAPI(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData)
    });
  }

  async deleteBlog(id) {
    return this.fetchAPI(`/blogs/${id}`, {
      method: 'DELETE'
    });
  }

  // Messages
  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetchAPI(`/messages${queryString ? '?' + queryString : ''}`);
  }

  async replyToMessage(id, replyContent) {
    return this.fetchAPI(`/messages/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ replyContent })
    });
  }

  async markMessageAsRead(id) {
    return this.fetchAPI(`/messages/${id}/read`, {
      method: 'PUT'
    });
  }

  // Upload
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append(type, file);

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    return response.json();
  }

  // Settings
  async getAdminSettings() {
    return this.fetchAPI('/admin/settings');
  }

  async updateSettings(settingsData) {
    return this.fetchAPI('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }
}

// Create global API instance
const api = new PortfolioAPI();