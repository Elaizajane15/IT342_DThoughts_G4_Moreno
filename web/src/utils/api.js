const BASE_URL = 'http://localhost:8080';

export const authApi = {
  async login({ email, password }) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
    return data;
  },
  async register({ email, password, firstName, lastName }) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Registration failed.');
    return data;
  },
}

export const quotesApi = {
  async getDailyQuote() {
    await delay(200)
    return {
      quoteText: 'Start where you are. Use what you have. Do what you can.',
      author: 'Arthur Ashe',
    }
  },
}

export const oauthApi = {
  googleLoginUrl() {
    return `${BASE_URL}/oauth2/authorization/google`
  },
}

export const postsApi = {
  async getAll(page = 0, size = 10) {
    await delay(200)
    const total = 23
    const totalPages = Math.ceil(total / size)
    const start = page * size
    const end = Math.min(start + size, total)
    const content = Array.from({ length: Math.max(0, end - start) }, (_, i) => {
      const id = start + i + 1
      return {
        id,
        userId: id % 3 === 0 ? 1 : 2,
        userName: id % 3 === 0 ? 'You' : 'Daily User',
        createdAt: new Date().toISOString(),
        text: `Thought #${id}: Stay consistent and keep improving every day.`,
      }
    })
    return { content, totalPages }
  },
  async delete(id) {
    await delay(150)
    return { ok: true, id }
  },
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
