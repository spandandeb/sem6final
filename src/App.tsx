import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Users, LogOut, BarChart, MessageSquare, Calendar, BookOpen } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MentorMatch from './components/MentorMatch';
import Analytics from './components/Analytics';
import Forums from './components/Forums';
import LoginPage from './pages/Login';
import Home from './pages/Home';
import ResourceLibraryPage from './pages/ResourceLibraryPage';
import EventsPage from './pages/EventsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import UserSignup from './components/UserSignup';
import AlumniSignup from './components/AlumniSignup';
import Login from './components/Login';
import DiscussionForum from './components/DiscussionForum';
import ChatInterface from './components/ChatInterface';

// Add console logs to verify imports
console.log("ResourceLibraryPage import:", ResourceLibraryPage);
console.log("EventsPage import:", EventsPage);
console.log("Login import:", Login);
console.log("LoginPage import:", LoginPage);

function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer"
              onClick={() => navigate('/')}
            >
              <Users className="h-6 w-6" />
              <span className="text-xl font-bold">AlumniConnect</span>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            {isAuthenticated && (
              <button 
                className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            )}
            <button 
              className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
              onClick={() => navigate('/mentors')}
            >
              Mentors
            </button>
            <button 
              className="text-gray-600 hover:text-indigo-600 transition-colors font-medium flex items-center"
              onClick={() => {
                console.log("Navigating to Resources");
                navigate('/resources');
              }}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Resources
            </button>
            <button 
              className="text-gray-600 hover:text-indigo-600 transition-colors font-medium flex items-center"
              onClick={() => {
                console.log("Navigating to Events");
                navigate('/events');
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </button>
            <button 
              className="text-gray-600 hover:text-indigo-600 transition-colors font-medium flex items-center"
              onClick={() => navigate('/forums')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Forums
            </button>
            {isAuthenticated && (
              <button 
                className="text-gray-600 hover:text-indigo-600 transition-colors font-medium flex items-center"
                onClick={() => navigate('/analytics')}
              >
                <BarChart className="h-4 w-4 mr-1" />
                Analytics
              </button>
            )}
            {isAuthenticated ? (
              <button 
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all transform hover:scale-105 font-medium flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            ) : (
              <button 
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  console.log("App component rendering");
  
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<ResourceLibraryPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/alumni-signup" element={<AlumniSignup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentors" element={<MentorMatch />} />
            <Route path="/chat/:alumniId" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/forums" element={<DiscussionForum />} />
            <Route path="/forums-old" element={<Forums currentUser={{
              id: 1,
              name: localStorage.getItem('userName') || 'Current User',
              role: 'Student',
              profileImage: "https://randomuser.me/api/portraits/lego/1.jpg"
            }} />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
