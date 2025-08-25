import React, { useState } from "react";
import "../assets/styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      alert("❌ User not found or incorrect credentials.");
      console.log("User not found", error);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <>
    <div className="login-screen">
      <div className="login-container">
        <h1>Login</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-box">
            <label htmlFor="emailAddress">Email Address:</label>
            <input type="email" id="emailAddress" placeholder="john.doe@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-box">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="login-btn">Login</button>

          <p>Don't have an account? <Link to="/signup"><span>Signup</span></Link></p>
        </form>
      </div>
    </div>
    <br/> <br/>
    </>
  );
}

export default Login;
