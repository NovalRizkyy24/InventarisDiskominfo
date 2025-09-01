import { useState } from "react";
import { Card, Input, Button, Typography, Alert } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

const roleToPath = (role) => {
  return role.toLowerCase().replace(/ /g, '-');
};

export function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); 
    try {
      const response = await fetch('/api/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal untuk login');
      
      localStorage.setItem('authToken', data.token);

      const userRole = data.user.role;
      const path = roleToPath(userRole);
      navigate(`/${path}/home`);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your username and password to Sign In.
          </Typography>
        </div>
        
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSignIn}>
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">Username</Typography>
            <Input size="lg" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">Password</Typography>
            <Input type="password" size="lg" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </div>

          <div className="mt-4 h-12">
            {error && (
              <Alert
                variant="ghost"
                color="red"
                icon={<InformationCircleIcon className="h-5 w-5" />}
              >
                <Typography variant="small" className="font-medium">{error}</Typography>
              </Alert>
            )}
          </div>

          <Button type="submit" className="mt-2" fullWidth disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover rounded-3xl" alt="Pattern" />
      </div>
    </section>
  );
}

export default SignIn;