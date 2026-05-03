import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, Award, Star, Loader2, AlertCircle } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { studentsAPI } from "../../api/students";
import { request } from "../../api/client";
const getLevelColor = (level: string) => {
  switch (level) {
    case "Expert":       return "bg-green-100 text-green-700 border-green-200";
    case "Advanced":     return "bg-blue-100 text-blue-700 border-blue-200";
    case "Intermediate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:             return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [vouches, setVouches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
const [showVouchForm, setShowVouchForm] = useState(false);
const [vouchMessage, setVouchMessage] = useState("");
const [vouching, setVouching] = useState(false);
const [hasVouched, setHasVouched] = useState(false);
 useEffect(() => {
  if (!id) return;
  setLoading(true);
  setError(null);

  Promise.all([
    studentsAPI.getById(id),
    studentsAPI.getVouches(id),
    studentsAPI.getReviews(id),
  ])
    .then(([s, v, r]) => {
  setStudent(s);
  setSkills([]);
  const vouchesList = Array.isArray(v) ? v : [];
  setVouches(vouchesList);
  setReviews(Array.isArray(r) ? r : []);
  setHasVouched(vouchesList.some((vouch: any) => vouch.voucherId === currentUserId));
})
    .catch((err) => setError(err.message || "Failed to load profile"))
    .finally(() => setLoading(false));
}, [id, currentUserId]);

useEffect(() => {
  request("/auth/me")
    .then((res: any) => setCurrentUserId(res.student?.studentId))
    .catch(() => {});
}, []);

  if (loading) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </div>
  );

  if (error || !student) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error || "Student not found"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 max-w-4xl mx-auto px-8 py-8">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 mb-6"
        >
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center flex-shrink-0">
              {student.profilePicture ? (
                <img src={student.profilePicture} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-3xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                {student.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Mail className="w-4 h-4" />
                <span style={{ fontFamily: "Geist", fontSize: "14px" }}>{student.email}</span>
              </div>
              {student.rollNumber && (
                <span className="text-gray-500" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                  Roll: {student.rollNumber}
                </span>
              )}
                {currentUserId && currentUserId !== student?.studentId && !hasVouched && (
  <div className="mt-4">
    {!showVouchForm ? (
      <button
        onClick={() => setShowVouchForm(true)}
        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
        style={{ fontFamily: "Geist", fontWeight: 500 }}
      >
        + Vouch
      </button>
    ) : (
      <div className="mt-2">
        <textarea
          value={vouchMessage}
          onChange={(e) => setVouchMessage(e.target.value)}
          placeholder="Write a vouch message..."
          className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400"
          style={{ fontFamily: "Geist", fontSize: "14px" }}
          rows={3}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
  setVouching(true);
  try {
    await request("/vouches", {
      method: "POST",
      body: JSON.stringify({ voucheeId: student.studentId, comment: vouchMessage }),
    });
    setShowVouchForm(false);
    setVouchMessage("");
    setHasVouched(true);
  } catch (err: any) {
    console.log("vouch error:", err.message);
    alert(err.message);
  }
  setVouching(false);
}}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
            style={{ fontFamily: "Geist", fontWeight: 500 }}
          >
            {vouching ? "Submitting..." : "Submit"}
          </button>
          <button
            onClick={() => setShowVouchForm(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors"
            style={{ fontFamily: "Geist", fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
)}

              
            </div>
          </div>

          {student.bio && (
            <div className="mt-6">
              <h3 className="text-lg mb-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>About</h3>
              <p className="text-gray-700" style={{ fontFamily: "Geist", fontSize: "15px", lineHeight: "1.7" }}>
                {student.bio}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { value: skills.length, label: "Skills" },
              { value: vouches.length, label: "Vouches" },
              { value: reviews.length, label: "Reviews" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{stat.value}</p>
                <p className="text-gray-500 text-sm" style={{ fontFamily: "Geist" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
        >
          <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>Skills</h3>
          {skills.length === 0 ? (
            <p className="text-gray-400 text-sm" style={{ fontFamily: "Geist" }}>No skills added yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {skills.map((skill: any) => (
                <div key={skill.studentSkillId ?? skill.name} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}>{skill.skillName ?? skill.name}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs border ${getLevelColor(skill.proficiencyLevel ?? skill.level ?? "")}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                    {skill.proficiencyLevel ?? skill.level ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
        >
          <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm" style={{ fontFamily: "Geist" }}>No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.reviewId} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6" }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Vouches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200"
        >
          <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
            <Award className="w-5 h-5" /> Vouches
          </h3>
          {vouches.length === 0 ? (
            <p className="text-gray-400 text-sm" style={{ fontFamily: "Geist" }}>No vouches yet.</p>
          ) : (
            <div className="space-y-4">
              {vouches.map((v: any) => {
  console.log("vouch object:", v);
  return (
    <div key={v.vouchId} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start justify-between">
  <div>
    <p className="font-medium mb-1" style={{ fontFamily: "Geist", fontSize: "14px" }}>
      {v.voucherName ?? "Anonymous"}
    </p>
    <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6" }}>{v.comment}</p>
  </div>
  {currentUserId === v.voucherId && (
    <button
      onClick={async () => {
        try {
          await request(`/vouches/${v.vouchId}`, { method: 'DELETE' });
          setVouches(prev => prev.filter((vouch: any) => vouch.vouchId !== v.vouchId));
        } catch (err: any) {
          alert(err.message);
        }
      }}
      className="text-gray-400 hover:text-red-500 transition-colors ml-2"
    >
      ✕
    </button>
  )}
</div>
  );
})}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}