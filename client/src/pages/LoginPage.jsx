export function LoginPage({ app }) {
  const { loginForm, setLoginForm, login, message } = app;

  return (
    <div className="login-screen">
      <div className="card glass">
        <img src="/logo.png" alt="Basirah Logo" className="brand-logo login-logo" />
        <h1>Basirah HR Portal</h1>
        <p>Modern user management with leave and salary workflows.</p>
        <form onSubmit={login} className="grid">
          <input
            placeholder="Email"
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          />
          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <button type="submit">Login</button>
        </form>
        <small>Default admin: admin@basirah.local / admin123</small>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
