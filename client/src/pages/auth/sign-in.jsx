import { useState } from "react";
import { Card, Input, Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";

// Fungsi helper untuk mengubah nama peran menjadi path URL
const roleToPath = (role) => {
  return role.toLowerCase().replace(/ /g, '-');
};

export function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal untuk login');
      
      localStorage.setItem('authToken', data.token);

      // Pengalihan dinamis berdasarkan peran
      const userRole = data.user.role;
      const path = roleToPath(userRole);
      navigate(`/${path}/home`);

    } catch (err) {
      setError(err.message);
    }
  };

  // Sisa JSX form login tetap sama...
  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your username and password to Sign In.
          </Typography>
        </div>
        {error && (
          <div className="mt-4 text-center p-2 bg-red-100 text-red-700 rounded-lg">
            <Typography>{error}</Typography>
          </div>
        )}
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSignIn}>
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">Username</Typography>
            <Input size="lg" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">Password</Typography>
            <Input type="password" size="lg" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="mt-6" fullWidth>Sign In</Button>
          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Not registered?
            <Link to="/auth/sign-up" className="text-gray-900 ml-1">Create account</Link>
          </Typography>
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover rounded-3xl" alt="Pattern" />
      </div>
    </section>
  );
}

export default SignIn;
