// Custom authentication service - no Firebase Auth dependency
class AuthService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  private tokenKey = 'blogosphere_token';
  private userKey = 'blogosphere_user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): any | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Store token and user
  private setAuthData(token: string, user: any): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear stored auth data
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Get auth headers for API requests
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Register new user
  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return {
        success: true,
        user: data.data.user,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; user?: any; token?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth data
      this.setAuthData(data.data.token, data.data.user);

      return {
        success: true,
        user: data.data.user,
        token: data.data.token,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  // Logout user
  logout(): void {
    this.clearAuthData();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Get current user profile
  async getCurrentUser(): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear auth data
          this.clearAuthData();
        }
        throw new Error(data.message || 'Failed to get user profile');
      }

      // Update stored user data
      localStorage.setItem(this.userKey, JSON.stringify(data.data.user));

      return {
        success: true,
        user: data.data.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get user profile'
      };
    }
  }

  // Update user profile
  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    username?: string;
    profile?: {
      bio?: string;
      location?: string;
      website?: string;
    };
  }): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update stored user data
      localStorage.setItem(this.userKey, JSON.stringify(data.data.user));

      return {
        success: true,
        user: data.data.user,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update profile'
      };
    }
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to change password'
      };
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user');
      }

      return {
        success: true,
        user: data.data.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get user'
      };
    }
  }

  // Check authentication status and refresh user data
  async checkAuthStatus(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const result = await this.getCurrentUser();
      return result.success;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;