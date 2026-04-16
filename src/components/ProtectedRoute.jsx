function ProtectedRoute({ user, fallback, children }) {
  if (!user) {
    return fallback;
  }

  return children;
}

export default ProtectedRoute;
