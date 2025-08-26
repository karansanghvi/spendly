import React, { useEffect, useState } from "react";
import "../assets/styles/profile.css";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setFormData(userDoc.data()); 
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userData) {
    return <p className="text-center font-semibold text-xl">No User Is Logged In</p>;
  }

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (editMode) {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.uid), formData);
        setUserData(formData);
        setEditMode(false);
        toast.success("Profile updated successfully");
      }
    } else {
      setEditMode(true); 
    }
  };

  return (
    <>
    <div className="profile-screen">
      <div className="profile-container">
        <h1>{editMode ? "Edit Profile" : "Profile"}</h1>
        <form className="profile-form" onSubmit={handleEditSave}>
          <div className="input-box">
            <label htmlFor="fullName">Full Name:</label>
            {editMode ? (
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            ) : (
              <p style={{ color: "black" }}>{userData.fullName}</p>
            )}
          </div>

          <div className="input-box">
            <label htmlFor="phoneNumber">Phone Number:</label>
            {editMode ? (
              <input
                type="text"
                id="phoneNumber"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            ) : (
              <p style={{ color: "black" }}>{userData.phone}</p>
            )}
          </div>

          <div className="input-box">
            <label htmlFor="emailAddress">Email Address:</label>
            {editMode ? (
              <input
                type="email"
                id="emailAddress"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            ) : (
              <p style={{ color: "black" }}>{userData.email}</p>
            )}
          </div>

          <button type="submit" className="edit-btn">
            {editMode ? "Save" : "Edit Profile"}
          </button>
        </form>
      </div>
    </div>

    <Footer />

    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 2000,
      }}
    />
    </>
  );
}

export default Profile;
