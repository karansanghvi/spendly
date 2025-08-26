import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Footer from "../components/Footer";

function Invite() {
  const [linkInput, setLinkInput] = useState("");
  const [joinedDashboards, setJoinedDashboards] = useState([]);
  const [acceptedDashboards, setAcceptedDashboards] = useState([]);
  const [userId, setUserId] = useState(null);
  const [linkModal, setLinkModal] = useState({
    visible: false,
    link: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchDashboards = async () => {
      // Dashboards joined by current user
      const joinedQuery = query(
        collection(db, "joinedDashboards"),
        where("userId", "==", userId)
      );
      const joinedSnap = await getDocs(joinedQuery);
      const joined = await Promise.all(
        joinedSnap.docs.map(async (d) => {
          const data = d.data();
          const userDoc = await getDoc(doc(db, "users", data.ownerId));
          const fullName = userDoc.exists() ? userDoc.data().fullName : "Unknown User";
          return { ...data, fullName, docId: d.id };
        })
      );
      setJoinedDashboards(joined);

      // Dashboards accepted by other users (where logged-in user is owner)
      const acceptedQuery = query(
        collection(db, "joinedDashboards"),
        where("ownerId", "==", userId)
      );
      const acceptedSnap = await getDocs(acceptedQuery);
      const accepted = await Promise.all(
        acceptedSnap.docs.map(async (d) => {
          const data = d.data();
          const userDoc = await getDoc(doc(db, "users", data.userId));
          const userFullName = userDoc.exists() ? userDoc.data().fullName : "Unknown User";
          return { ...data, userFullName, docId: d.id };
        })
      );
      setAcceptedDashboards(accepted);
    };

    fetchDashboards();
  }, [userId]);

  const handleGenerateLink = async () => {
    if (!userId) return;
    const token = uuidv4();
    await addDoc(collection(db, "sharedDashboards"), {
      ownerId: userId,
      token,
      createdAt: serverTimestamp(),
    });
    const link = `${window.location.origin}/shared-dashboard/${token}`;
    navigator.clipboard.writeText(link);
    setLinkModal({ visible: true, link });
    toast.success("Link copied to clipboard");
  };

  const closeModal = () => setLinkModal({ visible: false, link: "" });

  const handleJoinLink = async () => {
    if (!userId || !linkInput) return toast.error("Please paste a link.");
    const token = linkInput.split("/").pop();

    const q = query(collection(db, "sharedDashboards"), where("token", "==", token));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return toast.error("Invalid or expired link.");

    const dashboardData = snapshot.docs[0].data();
    const ownerId = dashboardData.ownerId;

    const alreadyJoined = joinedDashboards.find((d) => d.token === token);
    if (alreadyJoined) return toast.error("Already joined this dashboard.");

    const docRef = await addDoc(collection(db, "joinedDashboards"), {
      userId,
      ownerId,
      token,
      joinedAt: serverTimestamp(),
    });

    const userDoc = await getDoc(doc(db, "users", ownerId));
    const fullName = userDoc.exists() ? userDoc.data().fullName : "Unknown User";

    setJoinedDashboards((prev) => [...prev, { userId, ownerId, token, fullName, docId: docRef.id }]);
    setLinkInput("");

    toast.success(`Successfully joined ${fullName}'s dashboard!`);
  };

  const handleViewDashboard = (token) => navigate(`/shared-dashboard/${token}`);

  const handleLeave = async (docId) => {
    if (!window.confirm("Are you sure you want to leave this dashboard?")) return;

    await deleteDoc(doc(db, "joinedDashboards", docId));
    setJoinedDashboards((prev) => prev.filter((d) => d.docId !== docId));
    toast.success("You have left the dashboard");
  };

  // Take back invite for accepted dashboards
  const handleTakeBack = async (docId) => {
    if (!window.confirm("Are you sure you want to remove this user from your dashboard?")) return;

    await deleteDoc(doc(db, "joinedDashboards", docId));
    setAcceptedDashboards((prev) => prev.filter((d) => d.docId !== docId));
    toast.success("User removed from your dashboard.");
  };

  return (
    <>
      <div className="px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Collaborate</h1>

        <div className="mb-8 bg-white shadow-lg rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">Share Your Dashboard</h2>
              <p className="text-gray-500 text-sm mt-1">
                Click the button to generate a unique link that you can share with others.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleGenerateLink}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 transition text-lg font-semibold"
              >
                Generate Share Link
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Join a Dashboard</h2>
            <p className="text-gray-500 text-sm">
              Paste a link shared by another user below to access their dashboard.
            </p>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input
                type="text"
                placeholder="Paste shared link here"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="border rounded-lg px-4 py-2 w-full md:flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleJoinLink}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600 transition font-semibold w-full md:w-auto"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Joined and Accepted Tables */}
        {(joinedDashboards.length > 0 || acceptedDashboards.length > 0) && (
          <div className="overflow-x-auto mt-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-300">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-500">
                    <tr>
                      <th className="px-4 py-3 text-left text-md font-semibold text-white">User</th>
                      <th className="px-4 py-3 text-left text-md font-semibold text-white">Type</th>
                      <th className="px-4 py-3 text-left text-md font-semibold text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {joinedDashboards.map((d) => (
                      <tr key={`joined-${d.token}`} className="transition duration-200">
                        <td className="px-4 py-2 text-sm">{d.fullName}'s Dashboard</td>
                        <td className="px-4 py-2 text-sm text-gray-600">Joined</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleViewDashboard(d.token)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition font-medium"
                          >
                            View
                          </button>
                          <button
                          onClick={() => handleLeave(d.docId)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition font-medium"
                          >
                            Leave
                          </button>
                        </td>
                      </tr>
                    ))}

                    {acceptedDashboards.map((d) => (
                      <tr key={`accepted-${d.token}`} className="transition duration-200">
                        <td className="px-4 py-2 text-sm">{d.userFullName}'s Dashboard</td>
                        <td className="px-4 py-2 text-sm text-gray-600">Accepted</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleViewDashboard(d.token)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleTakeBack(d.docId)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition font-medium"
                          >
                            Take Back
                          </button>
                        </td>
                      </tr>
                    ))}

                    {joinedDashboards.length === 0 && acceptedDashboards.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-gray-500 text-sm">
                          No dashboards found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Link To Copy The Link */}
        {linkModal.visible && (
          <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Link Copied!</h2>
              <p className="text-gray-700 break-words mb-6">{linkModal.link}</p>
              <button
                onClick={closeModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>

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

export default Invite;
