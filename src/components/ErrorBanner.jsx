function ErrorBanner({ message }) {
  return <div className="error" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</div>;
}

export default ErrorBanner;
