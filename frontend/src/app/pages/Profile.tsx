import { request } from "../../api/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, GraduationCap, Briefcase, Star, Edit, User, Calendar,
  Plus, Award, TrendingUp, FileText, Clipboard, Clock, DollarSign,
  X, Search, Check,Loader2
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProfileData {
  name: string;
  rollNumber: string;
  email: string;
  campus: string;
  year: string;
  major: string;
  bio: string;
  workerRating: number;
  workerReviews: number;
  posterRating: number;
  posterReviews: number;
  completedJobs: number;
  totalVouches: number;
  completionRate: number;
  memberSince: string;
}

interface Skill {
  name: string;
  level: string;
}

// ─── Catalogue (for Add Skill picker) ────────────────────────────────────────
const ALL_SKILLS = [
  "React", "Node.js", "TypeScript", "Python", "Django", "FastAPI",
  "MongoDB", "PostgreSQL", "MySQL", "Flutter", "React Native", "Figma",
  "Adobe XD", "UI Design", "Machine Learning", "TensorFlow", "PyTorch",
  "AWS", "Docker", "GraphQL", "Next.js", "Vue.js", "SEO", "Copywriting",
  "Data Analysis", "Kotlin", "Swift", "Go", "Rust", "C++",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
type Level = typeof LEVELS[number];

const CAMPUSES = ["Islamabad", "Lahore", "Karachi", "Peshawar", "Chiniot-Faisalabad"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

// ─── Colour helpers ───────────────────────────────────────────────────────────
const getLevelColor = (level: string) => {
  switch (level) {
    case "Expert":       return "bg-green-100 text-green-700 border-green-200";
    case "Advanced":     return "bg-blue-100 text-blue-700 border-blue-200";
    case "Intermediate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:             return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Under Review": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Accepted":     return "bg-green-100 text-green-700 border-green-200";
    case "Rejected":     return "bg-red-100 text-red-700 border-red-200";
    case "Open":         return "bg-green-100 text-green-700 border-green-200";
    case "In Progress":  return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Completed":    return "bg-gray-100 text-gray-700 border-gray-200";
    default:             return "bg-gray-100 text-gray-700 border-gray-200";
  }
};



// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileData;
  onSave: (p: ProfileData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...profile });
  const set = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-2xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block mb-1.5 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
              Full Name
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              className={inputCls}
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block mb-1.5 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
              Bio
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={set("bio")}
              className={`${inputCls} resize-none`}
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
          </div>

          {/* Campus + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
                Campus
              </label>
              <select
                value={form.campus}
                onChange={set("campus")}
                className={`${inputCls} cursor-pointer`}
                style={{ fontFamily: "Geist", fontSize: "15px" }}
              >
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
                Year
              </label>
              <select
                value={form.year}
                onChange={set("year")}
                className={`${inputCls} cursor-pointer`}
                style={{ fontFamily: "Geist", fontSize: "15px" }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Major */}
          <div>
            <label className="block mb-1.5 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
              Major / Program
            </label>
            <input
              value={form.major}
              onChange={set("major")}
              className={inputCls}
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-gray-500" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
                Roll Number <span className="text-gray-400">(fixed)</span>
              </label>
              <input
                value={form.rollNumber}
                disabled
                className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                style={{ fontFamily: "Geist", fontSize: "15px" }}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-gray-500" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
                Email <span className="text-gray-400">(fixed)</span>
              </label>
              <input
                value={form.email}
                disabled
                className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                style={{ fontFamily: "Geist", fontSize: "15px" }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="flex-1 py-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-2xl hover:from-[#333] hover:to-[#222] transition-all flex items-center justify-center gap-2"
            style={{
              fontFamily: "Geist", fontSize: "15px", fontWeight: 500,
              boxShadow: "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)",
            }}
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Add Skill Modal ──────────────────────────────────────────────────────────
function AddSkillModal({
  existingSkills,
  onAdd,
  onClose,
}: {
  existingSkills: Skill[];
  onAdd: (skill: Skill) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("Intermediate");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const existingNames = new Set(existingSkills.map((s) => s.name));
  const filtered = ALL_SKILLS.filter(
    (s) => !existingNames.has(s) && s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // The confirmed skill name is either the selected suggestion or whatever was typed
  const confirmedName = selected ?? (search.trim() || null);
  const isDuplicate = !!confirmedName && existingNames.has(confirmedName);

 const handleAdd = async () => {
  if (!confirmedName || isDuplicate) return;
  try {
    await request("/students/me/skills", {
      method: "POST",
      body: JSON.stringify({
        skillId: confirmedName,
        proficiencyLevel: level.toUpperCase(),
      }),
    });
  } catch (e) {
    // fails silently, still adds locally
  }
  onAdd({ name: confirmedName, level });
  onClose();
};

  

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-2xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
            Add a Skill
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skill input */}
        <div className="mb-5" ref={dropRef}>
          <label className="block mb-2 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
            Skill Name
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
                setDropOpen(true);
              }}
              onFocus={() => setDropOpen(true)}
              placeholder="Type any skill or pick a suggestion…"
              className={`w-full pl-11 pr-10 py-3 bg-white border rounded-xl outline-none transition-colors ${
                isDuplicate ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"
              }`}
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSelected(null); setSearch(""); setDropOpen(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {dropOpen && filtered.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto">
                    {filtered.slice(0, 8).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => {
                          setSelected(s);
                          setSearch(s);
                          setDropOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: "Geist", fontSize: "14px" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duplicate warning */}
          <AnimatePresence>
            {isDuplicate && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-red-500"
                style={{ fontFamily: "Geist", fontSize: "13px" }}
              >
                You've already added "{confirmedName}".
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Proficiency level */}
        <div className="mb-7">
          <label className="block mb-3 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
            Proficiency Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`py-2.5 px-4 rounded-xl border text-sm transition-all ${
                  level === l
                    ? getLevelColor(l) + " ring-2 ring-offset-1 ring-gray-300"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Geist", fontWeight: 500 }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!confirmedName || isDuplicate}
            className={`flex-1 py-3 rounded-2xl text-white transition-all flex items-center justify-center gap-2 ${
              confirmedName && !isDuplicate
                ? "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            style={{
              fontFamily: "Geist", fontSize: "15px", fontWeight: 500,
              boxShadow: confirmedName && !isDuplicate
                ? "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)"
                : "none",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Profile page ────────────────────────────────────────────────────────
export default function Profile() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "posted">(
    
    location.pathname === "/jobs/mine" ? "posted" : "overview"
    
  );

 const [profile, setProfile] = useState<ProfileData | null>(null);
 useEffect(() => {
  request("/auth/me")
    .then((res: any) => setProfile(res.student ?? res))
    .catch(() => setError("Failed to load profile"));
}, []);

  // Mutable skills
  const [skills, setSkills] = useState<Skill[]>([
    { name: "React",            level: "Expert" },
    { name: "Node.js",          level: "Advanced" },
    { name: "TypeScript",       level: "Advanced" },
    { name: "MongoDB",          level: "Intermediate" },
    { name: "Python",           level: "Intermediate" },
    { name: "AWS",              level: "Intermediate" },
    { name: "Docker",           level: "Beginner" },
    { name: "Machine Learning", level: "Beginner" },
  ]);

  
const [applications, setApplications] = useState<any[]>([]);
const [vouches, setVouches] = useState<any[]>([]);
const [postedJobs, setPostedJobs] = useState<any[]>([]);
const [error, setError] = useState<string | null>(null);



useEffect(() => {
  // Posted jobs
  request("/jobs/mine")
    .then((res: any) => setPostedJobs(res.jobs ?? []))
    .catch(() => setPostedJobs([]));

  // My applications
  request("/applications/mine")
    .then((res: any) => setApplications(res.applications ?? []))
    .catch(() => setApplications([]));

  // My vouches
  request("/vouches/mine")
    .then((res: any) => setVouches(res.vouches ?? []))
    .catch(() => setVouches([]));
}, []);

  // Modal visibility
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddSkill,    setShowAddSkill]    = useState(false);

  
   if (!profile) return (
  <div className="min-h-screen">
    <VideoBackground />
    <TopBar />
    <Sidebar />
    <div className="pt-16 flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  </div>
);

return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditProfile && profile && (
          <EditProfileModal
            profile={profile}
            onSave={(p) => setProfile(p)}
            onClose={() => setShowEditProfile(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSkill && (
          <AddSkillModal
            existingSkills={skills}
            onAdd={(s) => setSkills((prev) => [...prev, s])}
            onClose={() => setShowAddSkill(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 mb-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex gap-6">
                <div className="w-28 h-28 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-14 h-14 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl mb-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    {profile.name}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600 mb-2">
                    <span style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      Roll: {profile.rollNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span style={{ fontFamily: "Geist", fontSize: "14px" }}>{profile.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span style={{ fontFamily: "Geist", fontSize: "14px" }}>
                        {profile.campus} Campus · {profile.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span style={{ fontFamily: "Geist", fontSize: "14px" }}>{profile.major}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile button */}
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg mb-3" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                About
              </h3>
              <p className="text-gray-700" style={{ fontFamily: "Geist", fontSize: "15px", lineHeight: "1.7" }}>
                {profile.bio}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { value: profile.completedJobs,   label: "Jobs Completed" },
                { value: profile.totalVouches,    label: "Total Vouches" },
                { value: `${profile.completionRate}%`, label: "Completion Rate" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{stat.value}</p>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>{stat.label}</p>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <p className="text-sm" style={{ fontFamily: "Geist", fontWeight: 600 }}>{profile.memberSince}</p>
                </div>
                <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>Member Since</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
          >
            {/* Tab bar */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {(["overview", "applications", "posted"] as const).map((tab) => {
                const icons = { overview: null, applications: <FileText className="w-4 h-4" />, posted: <Clipboard className="w-4 h-4" /> };
                const labels = { overview: "Overview", applications: "My Applications", posted: "My Posted Jobs" };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 flex items-center gap-2 transition-all ${
                      activeTab === tab ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: activeTab === tab ? 500 : 400 }}
                  >
                    {icons[tab]}
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Worker rating */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <TrendingUp className="w-5 h-5" /> Rating as Worker
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>{profile.workerRating}</div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.workerRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: "Geist" }}>Based on {profile.workerReviews} reviews</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full" style={{ width: `${(profile.workerRating / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Poster rating */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <Briefcase className="w-5 h-5" /> Rating as Job Poster
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>{profile.posterRating}</div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.posterRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: "Geist" }}>Based on {profile.posterReviews} reviews</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full" style={{ width: `${(profile.posterRating / 5) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      Skills & Proficiency
                    </h3>
                    <button
                      onClick={() => setShowAddSkill(true)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Skill
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                      {skills.map((skill) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl group"
                        >
                          <span style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}>{skill.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs border ${getLevelColor(skill.level)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                              {skill.level}
                            </span>
                            <button
                              onClick={() => setSkills((prev) => prev.filter((s) => s.name !== skill.name))}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center hover:bg-red-100 rounded-lg text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {skills.length === 0 && (
                    <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      No skills added yet. Click "Add Skill" to get started.
                    </p>
                  )}
                </div>

              {/* Vouches */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <Award className="w-5 h-5" /> Vouches ({vouches.length})
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {vouches.length === 0 ? (
                      <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                        No vouches yet.
                      </p>
                    ) : (
                      vouches.map((vouch: any) => (
                        <div key={vouch.vouchId} className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span style={{ fontFamily: "Geist", fontWeight: 600, fontSize: "14px" }}>
                                  {vouch.giverName?.[0] ?? "?"}
                                </span>
                              </div>
                              <div>
                                <p style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}>
                                  {vouch.giverName ?? "Anonymous"}
                                </p>
                                <p className="text-xs text-gray-600" style={{ fontFamily: "Geist" }}>
                                  {vouch.createdAt ? new Date(vouch.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6" }}>
                            {vouch.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Applications ── */}
            {activeTab === "applications" && (
              <div className="space-y-4">
                <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                  Jobs You've Applied To ({applications.length})
                </h3>
                {applications.map((app) => (
                  <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link to={`/jobs/${app.id}`}>
                          <h4 className="text-lg mb-1 hover:underline" style={{ fontFamily: "Geist", fontWeight: 600 }}>{app.jobTitle}</h4>
                        </Link>
                        <p className="text-gray-600 text-sm mb-2" style={{ fontFamily: "Geist" }}>{app.company}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(app.status)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /><span style={{ fontFamily: "Geist" }}>{app.budget}</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span style={{ fontFamily: "Geist" }}>Applied {app.appliedDate}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Posted jobs ── */}
{activeTab === "posted" && (
  <div className="space-y-4">
    <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
      Jobs You've Posted ({postedJobs.length})
    </h3>
    {postedJobs.length === 0 ? (
      <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
        No jobs posted yet.
      </p>
    ) : (
      postedJobs.map((job: any) => (
        <div key={job.jobId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{job.title}</h4>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(job.status)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
              {job.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              {job.budget && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span style={{ fontFamily: "Geist" }}>{job.budget}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span style={{ fontFamily: "Geist" }}>{job.applicationCount ?? 0} applicants</span>
              </div>
            </div>
            <div className="flex gap-2">
  <Link
    to={`/jobs/${job.jobId}`}
    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
    style={{ fontFamily: "Geist", fontWeight: 500 }}
  >
    View & Manage →
  </Link>
  {job.status === 'IN_PROGRESS' && (
    <button
      onClick={async () => {
        try {
          await request(`/jobs/${job.jobId}/complete`, { method: 'PATCH' });
          setPostedJobs((prev: any) => prev.map((j: any) =>
            j.jobId === job.jobId ? { ...j, status: 'COMPLETED' } : j
          ));
        } catch (err: any) {
          alert(err.message);
        }
      }}
      className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors"
      style={{ fontFamily: "Geist", fontWeight: 500 }}
    >
      Mark Complete
    </button>
  )}
</div>
          </div>
        </div>
      ))
    )}
  </div>
)}
          </motion.div>
        </div>
      </div>
    </div>
  );
}