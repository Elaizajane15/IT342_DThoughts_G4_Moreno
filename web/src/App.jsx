import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPasswordPage from './pages/ForgotPassword'
import CreatePost from './pages/CreatePost'
import EditPostPage from './pages/EditPost'
import Profile from './pages/Profile'
import Notification from './pages/Notification'
import PostDetail from './pages/PostDetail'
import Feed from './pages/Feed'
import Drafts from './pages/Drafts.jsx'

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
