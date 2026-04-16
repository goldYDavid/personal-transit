import { useState } from 'react';

function LoginForm({ onSubmit, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({ email, password });
    setSubmitting(false);
  };

  return (
    <div className="login-wrap card">
      <h1>כניסה למערכת</h1>
      <p>התחברות אישית לתכנון נסיעה קבועה בין קריית מלאכי לרחובות.</p>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>אימייל</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>סיסמה</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <div className="error">{error}</div> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'מתחבר...' : 'התחברות'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
