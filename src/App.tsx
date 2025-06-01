import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './contexts/UserContext';


import Login from './components/Login';
import Signup from './components/Signup';
import ProfileNew from './components/ProfileNew';
import Home from './components/Home';
import CompanyHome from './components/CompanyHome';
import JobsWithErrorBoundary from './components/Jobs';
import PostDetail from './components/PostDetail';
import About from './components/About';
import Contact from './components/Contact';
import AIMentor from './components/AIMentor';
import ResumeGenerator from './components/ResumeGenerator';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import CreatePost from './components/CreatePost';
import { initializeTheme } from './utils/theme';
import MinimalJobsList from './components/MinimalJobsList';
import EmployerDashboard from './pages/EmployerDashboard';
import Subscription from './pages/Subscription';
import FAQPage from './pages/FAQPage';
import ResumeReview from './pages/ResumeReview';
import ProfileEdit from './components/ProfileEdit';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AdminLayout from './pages/AdminLayout';
import AdminModeration from './pages/AdminModeration';
import AdminStats from './pages/AdminStats';
import AdminUsers from './pages/AdminUsers';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserData } from './types';
import Applications from './pages/Applications';

// Импорт компонентов для нетворкинга
import Networking from './pages/Networking';
import NetworkingProjects from './pages/NetworkingProjects';


initializeTheme();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, userData } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-accent"></div>
        <div className="ml-2">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  
  if (allowedRoles && (!userData?.role || !allowedRoles.includes(userData.role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};


const DashboardRouter: React.FC = () => {
  const { userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-accent"></div>
        <div className="ml-2">Загрузка...</div>
      </div>
    );
  }

  
  const userRole = userData?.role as string;
  if (userRole === 'employer' || userRole === 'business') {
    return <EmployerDashboard />;
  } else {
    return <Dashboard />;
  }
};


const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-accent"></div>
        <div className="ml-2">Загрузка...</div>
      </div>
    );
  }
  
  
  return user ? <DashboardRouter /> : <Home />;
};


const ProfileEditWrapper: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          setProfileData(userSnapshot.data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleSave = async (formData: Partial<UserData>) => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, formData);
    navigate('/profile');
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <ProfileEdit 
      userData={profileData} 
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

const App: React.FC = () => {
  console.log("App rendering");
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-dark text-gray-900 dark:text-white">
              <Navbar />
              <Routes>
                {/* Корневой маршрут теперь перенаправляет на дашборд, если пользователь авторизован */}
                <Route path="/" element={<RootRoute />} />
                <Route path="/company" element={<CompanyHome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/jobs" element={<JobsWithErrorBoundary />} />
                <Route path="/jobs/:id" element={<PostDetail />} />
                <Route path="/ai-mentor" element={<AIMentor />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/resume-generator" element={<ResumeGenerator />} />
                <Route path="/faq" element={<FAQPage />} />
                
                {/* Protected route for creating posts (only for employers) */}
                <Route 
                  path="/create-post" 
                  element={
                    <ProtectedRoute allowedRoles={['employer', 'business']}>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
                
                {/* Chat routes */}
                <Route 
                  path="/chats" 
                  element={
                    <ProtectedRoute>
                      <ChatList />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/chat/:id" 
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfileNew />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/profile/edit" 
                  element={
                    <ProtectedRoute>
                      <ProfileEditWrapper />
                    </ProtectedRoute>
                  }
                />

                
                <Route 
                  path="/employer/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['employer', 'business']}>
                      <EmployerDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/employer/applications" 
                  element={
                    <ProtectedRoute allowedRoles={['employer', 'business']}>
                      <Applications />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/student/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['student', 'professional']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="/subscription" element={<Subscription />} />
                
                <Route 
                  path="/resume-review" 
                  element={<ResumeReview />}
                />

                {/* Новые маршруты для нетворкинга */}
                <Route 
                  path="/networking" 
                  element={
                    <ProtectedRoute>
                      <Networking />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/networking/projects" 
                  element={
                    <ProtectedRoute>
                      <NetworkingProjects />
                    </ProtectedRoute>
                  }
                />
                
                <Route 
                  path="/project/:id" 
                  element={
                    <ProtectedRoute>
                      <NetworkingProjects />
                    </ProtectedRoute>
                  }
                />
                
                {/* Админ-панель с вложенными маршрутами */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminPanel />} />
                  <Route path="jobs" element={<AdminPanel />} />
                  <Route path="moderation" element={<AdminModeration />} />
                  <Route path="stats" element={<AdminStats />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminPanel />} />
                </Route>
                
                {/* Универсальный маршрут дашборда */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;