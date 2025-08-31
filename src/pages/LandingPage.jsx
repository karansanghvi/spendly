import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/cashsync.png";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

function LandingPage() {

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center">
        <div className="flex justify-center">
            <img src={logo} alt="CashSync Logo" width={100} height={100} />
        </div>
        <h1 className="md:text-8xl text-6xl font-extrabold text-gray-800 mb-6 mt-6">
          Welcome to <span className="text-blue-600">CashSync</span>
        </h1>
        <p className="md:text-2xl text-xl text-black md:mb-10">
          Track expenses, manage budgets, and collaborate effortlessly with others.
        </p>
        <div className="flex justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-blue-500 text-white py-3 px-6 md:px-10 rounded-lg font-semibold text-2xl hover:bg-blue-600 mt-4 md:mt-0"
            >
              Go To Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white py-3 px-6 md:px-10 rounded-lg font-semibold text-2xl hover:bg-blue-600 mt-4 md:mt-0"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
