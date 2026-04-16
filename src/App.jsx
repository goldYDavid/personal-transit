import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import MainScreen from './components/MainScreen';
import LoadingState from './components/LoadingState';

function App() {
  const { user, loading, login, logout, loginError } = useAuth();

  if (loading) {
    return <LoadingState text="בודק התחברות..." />;
  }

  return (
    <div className="app-shell">
      <ProtectedRoute
        user={user}
        fallback={<LoginForm onSubmit={login} error={loginError} />}
      >
        <MainScreen user={user} onLogout={logout} />
      </ProtectedRoute>
    </div>
  );
}

export default App;
