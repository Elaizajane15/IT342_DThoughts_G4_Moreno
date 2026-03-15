const envUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = envUrl || (isLocalhost ? 'http://localhost:8080' : '');

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
  async forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to request reset code.')
    return { message: data.message || 'If an account exists, a reset code has been generated.' }
  },
  async resetPassword({ token, newPassword }) {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to reset password.')
    return { message: data.message || 'Password has been reset successfully.' }
  },
  async logout() {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
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

export const userApi = {
  async getById(userId) {
    const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(userId)}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'User not found.')
    return data
  },
  async getFollowStatus(followingId, followerId) {
    const qs = followerId != null ? `?followerId=${encodeURIComponent(followerId)}` : ''
    const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(followingId)}/follow${qs}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load follow status.')
    return {
      following: !!(data.following ?? data.isFollowing),
      followerCount: Number(data.followerCount) || 0,
      followingCount: Number(data.followingCount) || 0,
    }
  },
  async toggleFollow(followingId, followerId) {
    const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(followingId)}/follow/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ followerId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to follow user.')
    return {
      following: !!(data.following ?? data.isFollowing),
      followerCount: Number(data.followerCount) || 0,
      followingCount: Number(data.followingCount) || 0,
    }
  },
  async search(q, { limit = 25 } = {}) {
    const qs = new URLSearchParams()
    if (q != null) qs.set('q', String(q))
    qs.set('limit', String(limit))
    const res = await fetch(`${BASE_URL}/api/user/search?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(data.message || 'Failed to search users.')
    return Array.isArray(data) ? data : []
  },
  async getLikedPosts(userId) {
    const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(userId)}/liked-posts`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(data.message || 'Failed to load liked posts.')
    return Array.isArray(data) ? data.map(normalizePost).filter(Boolean) : []
  },
  async getSavedPosts(userId) {
    const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(userId)}/saved-posts`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(data.message || 'Failed to load saved posts.')
    return Array.isArray(data) ? data.map(normalizePost).filter(Boolean) : []
  },
  async getMyPosts() {
    const uStr = localStorage.getItem('user')
    let u = null
    try { u = uStr ? JSON.parse(uStr) : null } catch { u = null }
    const res = await postsApi.getAll(0, 50)
    const content = Array.isArray(res.content) && u?.id != null
      ? res.content.filter(p => p.userId === u.id)
      : res.content
    return { content }
  },
  async updateProfile(updates) {
    const uStr = localStorage.getItem('user')
    let u = null
    try { u = uStr ? JSON.parse(uStr) : null } catch { u = null }
    const body = {
      email: u?.email || updates.email,
      firstName: updates.firstName,
      lastName: updates.lastName,
      bio: updates.bio,
      avatarUrl: updates.avatarUrl,
      coverImageUrl: updates.coverImageUrl,
      birthDate: updates.birthDate,
    }
    const res = await fetch(`${BASE_URL}/api/user/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to update profile.')
    return data
  },
}

function normalizePost(post) {
  if (!post) return null
  return {
    id: post.id,
    userId: post.userId ?? null,
    userName: post.userName ?? null,
    userAvatarUrl: post.userAvatarUrl ?? null,
    createdAt: post.createdAt ?? null,
    updatedAt: post.updatedAt ?? null,
    imagePath: post.imagePath ?? post.imageUrl ?? null,
    text: post.content ?? post.text ?? '',
    likeCount: typeof post.likeCount === 'number' ? post.likeCount : Number(post.likeCount) || 0,
    commentCount: typeof post.commentCount === 'number' ? post.commentCount : Number(post.commentCount) || 0,
  }
}

export const postsApi = {
  async getAll(page = 0, size = 10) {
    const res = await fetch(`${BASE_URL}/api/posts?page=${page}&size=${size}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load posts.')
    const content = Array.isArray(data.content) ? data.content.map(normalizePost).filter(Boolean) : []
    return {
      content,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 0,
      totalElements: typeof data.totalElements === 'number' ? data.totalElements : content.length,
      page: typeof data.page === 'number' ? data.page : page,
      size: typeof data.size === 'number' ? data.size : size,
    }
  },
  async getFollowing(userId, page = 0, size = 10) {
    if (userId == null) throw new Error('userId is required.')
    const qs = new URLSearchParams()
    qs.set('userId', String(userId))
    qs.set('page', String(page))
    qs.set('size', String(size))
    const res = await fetch(`${BASE_URL}/api/posts/following?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load following posts.')
    const content = Array.isArray(data.content) ? data.content.map(normalizePost).filter(Boolean) : []
    return {
      content,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 0,
      totalElements: typeof data.totalElements === 'number' ? data.totalElements : content.length,
      page: typeof data.page === 'number' ? data.page : page,
      size: typeof data.size === 'number' ? data.size : size,
    }
  },
  async create({ userId, content }) {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, content }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to publish.')
    return normalizePost(data)
  },
  async update(id, { content }) {
    const res = await fetch(`${BASE_URL}/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to update.')
    return normalizePost(data)
  },
  async getLikeStatus(postId, userId) {
    const qs = userId != null ? `?userId=${encodeURIComponent(userId)}` : ''
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/likes${qs}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load likes.')
    return { liked: !!data.liked, likeCount: Number(data.likeCount) || 0 }
  },
  async toggleLike(postId, userId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/likes/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to like.')
    return { liked: !!data.liked, likeCount: Number(data.likeCount) || 0 }
  },
  async getSaveStatus(postId, userId) {
    const qs = userId != null ? `?userId=${encodeURIComponent(userId)}` : ''
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/saves${qs}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load saves.')
    return { saved: !!data.saved, saveCount: Number(data.saveCount) || 0 }
  },
  async toggleSave(postId, userId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/saves/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to save post.')
    return { saved: !!data.saved, saveCount: Number(data.saveCount) || 0 }
  },
  async getComments(postId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(data.message || 'Failed to load comments.')
    const list = Array.isArray(data) ? data : []
    return list.map((c) => ({
      id: c.id,
      userId: c.userId ?? null,
      userName: c.userName ?? null,
      userAvatarUrl: c.userAvatarUrl ?? null,
      content: c.content ?? '',
      createdAt: c.createdAt ?? null,
    }))
  },
  async addComment(postId, { userId, content }) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, content }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to add comment.')
    return {
      id: data.id,
      userId: data.userId ?? null,
      userName: data.userName ?? null,
      userAvatarUrl: data.userAvatarUrl ?? null,
      content: data.content ?? '',
      createdAt: data.createdAt ?? null,
    }
  },
  async delete(id) {
    const res = await fetch(`${BASE_URL}/api/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to delete.')
    }
    return { ok: true, id }
  },
}

export const draftsApi = {
  async save({ userId, title = null, content, mood = null, status = 'draft' }) {
    const res = await fetch(`${BASE_URL}/api/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, title, content, mood, status }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to save draft.')
    return {
      id: data.id,
      userId: data.userId ?? null,
      title: data.title ?? null,
      content: data.content ?? '',
      status: data.status ?? 'draft',
      mood: data.mood ?? null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  },
  async getMy(userId) {
    if (userId == null) throw new Error('userId is required.')
    const res = await fetch(`${BASE_URL}/api/drafts/me?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      credentials: 'include',
    })
    if (res.status === 404) return null
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load draft.')
    return {
      id: data.id,
      userId: data.userId ?? null,
      title: data.title ?? null,
      content: data.content ?? '',
      status: data.status ?? 'draft',
      mood: data.mood ?? null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  },
  async delete(id) {
    const res = await fetch(`${BASE_URL}/api/drafts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to delete draft.')
    }
    return { ok: true, id }
  },
}

export const filesApi = {
  async upload(postId, file) {
    if (postId == null) throw new Error('postId is required.')
    if (!file) throw new Error('file is required.')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to upload.')
    return normalizePost(data)
  },
  async uploadProfileImage(file) {
    const uStr = localStorage.getItem('user')
    let u = null
    try { u = uStr ? JSON.parse(uStr) : null } catch { u = null }
    if (!u?.email) throw new Error('Not logged in.')
    if (!file) throw new Error('file is required.')

    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/user/me/avatar?email=${encodeURIComponent(u.email)}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to upload.')
    return data
  },
  async uploadCoverImage(file) {
    const uStr = localStorage.getItem('user')
    let u = null
    try { u = uStr ? JSON.parse(uStr) : null } catch { u = null }
    if (!u?.email) throw new Error('Not logged in.')
    if (!file) throw new Error('file is required.')

    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/user/me/cover?email=${encodeURIComponent(u.email)}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to upload.')
    return data
  },
  getUrl(path) {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path
    return `${BASE_URL}${path}`
  },
}

export const notificationsApi = {
  async listMine(userId) {
    if (userId == null) throw new Error('userId is required.')
    const qs = new URLSearchParams()
    qs.set('userId', String(userId))
    const res = await fetch(`${BASE_URL}/api/notifications/me?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(data.message || 'Failed to load notifications.')
    return Array.isArray(data) ? data : []
  },
  async unreadCount(userId) {
    if (userId == null) throw new Error('userId is required.')
    const qs = new URLSearchParams()
    qs.set('userId', String(userId))
    const res = await fetch(`${BASE_URL}/api/notifications/me/unread-count?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to load unread count.')
    return Number(data.unreadCount) || 0
  },
  async markAllRead(userId) {
    if (userId == null) throw new Error('userId is required.')
    const qs = new URLSearchParams()
    qs.set('userId', String(userId))
    const res = await fetch(`${BASE_URL}/api/notifications/me/read-all?${qs.toString()}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to mark all read.')
    }
    return { ok: true }
  },
  async markRead(userId, notificationId) {
    if (userId == null) throw new Error('userId is required.')
    if (notificationId == null) throw new Error('notificationId is required.')
    const qs = new URLSearchParams()
    qs.set('userId', String(userId))
    const res = await fetch(`${BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/read?${qs.toString()}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to mark read.')
    }
    return { ok: true, id: notificationId }
  },
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
