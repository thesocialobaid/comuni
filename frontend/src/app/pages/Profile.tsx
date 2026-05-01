import { motion } from "framer-motion";
import {
  Mail,
  Star,
  Edit,
  User,
  Plus,
  Award,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";

import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { studentsAPI } from "@/api/students";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "applications" | "posted"
  >("overview");

  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [vouches, setVouches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        // ✅ FIX: unwrap student properly
        const res = await api.getMe();
        const me = res.student;
        setProfile(me);

        const [s, v, r] = await Promise.all([
          studentsAPI.getMySkills(),
          studentsAPI.getVouches(me.studentId),
          studentsAPI.getReviews(me.studentId),
        ]);

        // ✅ force arrays always
        setSkills(Array.isArray(s) ? s : []);
        setVouches(Array.isArray(v) ? v : []);
        setReviews(Array.isArray(r) ? r : []);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <VideoBackground />
        <TopBar />
        <Sidebar />

        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <VideoBackground />
        <TopBar />
        <Sidebar />

        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error || "Profile not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 max-w-6xl mx-auto px-8 py-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-6">
              <div className="w-28 h-28 bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              <div>
                <h2 className="text-3xl font-semibold">{profile.name}</h2>

                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
              </div>
            </div>

            <button className="px-4 py-2 bg-gray-100 rounded-xl flex gap-2 items-center">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold">{skills.length}</p>
              <p className="text-sm text-gray-500">Skills</p>
            </div>

            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold">{vouches.length}</p>
              <p className="text-sm text-gray-500">Vouches</p>
            </div>

            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold">{reviews.length}</p>
              <p className="text-sm text-gray-500">Reviews</p>
            </div>
          </div>
        </motion.div>

        {/* SKILLS */}
        <div className="mt-6 bg-white rounded-2xl p-6 border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Skills</h3>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills added yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {skills.map((skill: any) => (
                <div
                  key={skill.id}
                  className="flex justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <span>{skill.name}</span>
                  <span className="text-xs text-gray-500">
                    {skill.level || "Beginner"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VOUCHES */}
        <div className="mt-6 bg-white rounded-2xl p-6 border">
          <h3 className="font-semibold text-lg mb-4">Vouches</h3>

          {vouches.length === 0 ? (
            <p className="text-gray-500 text-sm">No vouches yet.</p>
          ) : (
            vouches.map((v: any) => (
              <div key={v.id} className="p-3 bg-gray-50 rounded-xl mb-2">
                {v.message}
              </div>
            ))
          )}
        </div>

        {/* REVIEWS */}
        <div className="mt-6 bg-white rounded-2xl p-6 border">
          <h3 className="font-semibold text-lg mb-4">Reviews</h3>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          ) : (
            reviews.map((r: any) => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-xl mb-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < r.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}