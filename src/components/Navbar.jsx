import React, { useState, useRef, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import logo from "../assets/images/cashsync.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setFullName(docSnap.data().fullName);
          }
        });
      } else {
        setUser(null);
        setFullName("");
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed w-full top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src={logo}       
                alt="CashSync Logo"
                className="h-6 w-6 md:h-8 md:w-8"
              />
              <Link to="/" className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-black">CashSync</h1>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 mx-auto">
              <Link to="/dashboard" className="text-xl font-semibold text-gray-800 hover:text-blue-500 transition">
                Home
              </Link>
              <Link to="/expenses" className="text-xl font-semibold text-gray-800 hover:text-blue-500 transition">
                Expenses
              </Link>
              <Link to="/invite" className="text-xl font-semibold text-gray-800 hover:text-blue-500 transition">
                Collaborate
              </Link>
            </div>

            {/* User Dropdown */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              {user ? (
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded shadow-md transition"
                  >
                    {fullName}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded shadow-md transition"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800 focus:outline-none">
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t shadow-lg px-6 py-4 space-y-4">
            <Link
              to="/dashboard"
              className="block text-lg font-semibold text-gray-800 hover:text-blue-500 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/expenses"
              className="block text-lg font-semibold text-gray-800 hover:text-blue-500 transition"
              onClick={() => setIsOpen(false)}
            >
              Expenses
            </Link>
            <Link 
              to="/invite" 
              className="text-xl font-semibold text-gray-800 hover:text-blue-500 transition"
              onClick={() => setIsOpen(false)}
            >
                Collaborate
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block text-lg font-semibold text-gray-800 hover:text-blue-500 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow-md transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow-md transition"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="p-4">
        <Outlet />
      </div>
    </>
  );
}

export default Navbar;
