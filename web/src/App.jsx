import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/features/auth/Login'
import RegisterPage from '@/features/auth/Register'
import ForgotPasswordPage from '@/features/auth/ForgotPassword'
import CreatePost from '@/features/post/CreatePost'
import EditPostPage from '@/features/post/EditPost'
import Profile from '@/features/profile/Profile'
import Notification from '@/features/notification/Notification'
import PostDetail from '@/features/post/PostDetail'
import Feed from '@/features/post/Feed'
import Drafts from '@/features/draft/Drafts'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/notification" element={<Notification />} />
      <Route path="/drafts" element={<Drafts />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/edit/:id" element={<EditPostPage />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
