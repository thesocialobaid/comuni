import { request } from "../../api/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, GraduationCap, Briefcase, Star, Edit, User, Calendar,
  Plus, Award, TrendingUp, FileText, Clipboard, Clock, DollarSign,
  X, Search, Check, Loader2, ShieldCheck,
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ─── Types (matched exactly to backend responses) ─────────────────────────────

// GET /api/auth/me → { student: ProfileData }
interface ProfileData {
  studentId: number;
  rollNumber: string;
  email: string;
  name: string;
  bio: string | null;
  profilePicture: string | null;
  workerRating: number;
  workerRatingCount: number;
  giverRating: number;
  giverRatingCount: number;
  jobsPostedCount: number;
  jobsCompletedCount: number;
  totalVouchCount: number;
  verifiedReviewer: boolean;
  createdAt: string;
}

// GET /api/students/me/skills → { skills: SkillData[] }
interface SkillData {
  studentSkillId: number;
  skillId: string;
  skillName: string;
  category: string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  relevantComp: number;
  addedAt: string;
}

// GET /api/applications/mine → { applications: ApplicationData[] }
interface ApplicationData {
  applicationId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  rankScore: number | null;
  appliedAt: string;
  resolvedAt: string | null;
  jobId: number;
  title: string;
  budget: string | null;
  deadline: string | null;
  jobStatus: string;
  urgent: boolean;
  posterName: string;
}

// GET /api/jobs/mine → { jobs: PostedJob[] }
interface PostedJob {
  jobId: number;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  budget: string | null;
  deadline: string | null;
  urgent: boolean;
  createdAt: string;
  completedAt: string | null;
  workerName: string | null;
  applicantCount: number;
}



// GET /api/students/:studentId/vouches → { vouches: ReceivedVouch[] }
interface ReceivedVouch {
  vouchId: number;
  comment: string | null;
  createdAt: string;
  voucherName: string;
  voucherId: number;
  skillName: string | null;
  skillId: string | null;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const getLevelColor = (level: string) => {
  switch (level) {
    case "EXPERT":       return "bg-green-100 text-green-700 border-green-200";
    case "ADVANCED":     return "bg-blue-100 text-blue-700 border-blue-200";
    case "INTERMEDIATE": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:             return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case "EXPERT":       return "Expert";
    case "ADVANCED":     return "Advanced";
    case "INTERMEDIATE": return "Intermediate";
    default:             return "Beginner";
  }
};

// Application status from backend: PENDING | ACCEPTED | REJECTED | WITHDRAWN
const getAppStatusColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":  return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED":  return "bg-red-100 text-red-700 border-red-200";
    case "WITHDRAWN": return "bg-gray-100 text-gray-500 border-gray-200";
    default:          return "bg-blue-100 text-blue-700 border-blue-200"; // PENDING
  }
};

const getAppStatusLabel = (status: string) => {
  switch (status) {
    case "ACCEPTED":  return "Accepted";
    case "REJECTED":  return "Rejected";
    case "WITHDRAWN": return "Withdrawn";
    default:          return "Under Review";
  }
};

// Job status from backend: OPEN | IN_PROGRESS | COMPLETED | CANCELLED
const getJobStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":        return "bg-green-100 text-green-700 border-green-200";
    case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "COMPLETED":   return "bg-gray-100 text-gray-700 border-gray-200";
    case "CANCELLED":   return "bg-red-100 text-red-700 border-red-200";
    default:            return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getJobStatusLabel = (status: string) => {
  switch (status) {
    case "OPEN":        return "Open";
    case "IN_PROGRESS": return "In Progress";
    case "COMPLETED":   return "Completed";
    case "CANCELLED":   return "Cancelled";
    default:            return status;
  }
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
// PATCH /api/students/me — only accepts: name, bio, profilePicture
function EditProfileModal({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileData;
  onSave: (updated: Partial<ProfileData>) => void;
  onClose: () => void;
}) {
  const [name, setName]   = useState(profile.name);
  const [bio, setBio]     = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await request("/students/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });
      onSave(res.student ?? { name: name.trim(), bio: bio.trim() });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-2xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>Edit Profile</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself…"
              className={`${inputCls} resize-none`}
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
                value={profile.rollNumber}
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
                value={profile.email}
                disabled
                className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                style={{ fontFamily: "Geist", fontSize: "15px" }}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500" style={{ fontFamily: "Geist" }}>{error}</p>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-2xl hover:from-[#333] hover:to-[#222] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Hardcoded skill catalogue (frontend only) ────────────────────────────────
const SKILL_CATALOGUE = [
  // Development
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "PHP", "SQL", "MongoDB", "REST APIs", "Git", "Docker", "Linux", "Next.js",
  "Express.js", "Flutter", "React Native", "Firebase",
  // Design
  "UI/UX Design", "Figma", "Adobe Photoshop", "Adobe Illustrator", "Canva",
  "Motion Graphics", "Logo Design", "Wireframing", "Prototyping",
  // Data
  "Data Analysis", "Excel / Sheets", "Power BI", "Tableau", "Pandas", "NumPy",
  "Data Scraping", "Statistics", "R",
  // Content
  "Content Writing", "Copywriting", "SEO", "Social Media", "Video Editing",
  "Photography", "Urdu Writing", "Translation", "Proofreading",
  // AI/ML
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
  "Computer Vision", "Prompt Engineering", "LangChain",
];

// ─── Add Skill Modal ──────────────────────────────────────────────────────────
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
type Level = typeof LEVELS[number];

function AddSkillModal({
  existingSkillIds,
  onAdd,
  onClose,
}: {
  existingSkillIds: Set<string>;
  onAdd: (skill: SkillData) => void;
  onClose: () => void;
}) {
  const [input, setInput]           = useState("");
  const [level, setLevel]           = useState<Level>("INTERMEDIATE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Suggestions: catalogue items matching input, not already added
  const suggestions = input.trim().length === 0
    ? []
    : SKILL_CATALOGUE.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) &&
          !existingSkillIds.has(s.toLowerCase())
      ).slice(0, 6);

  const handleAdd = async () => {
    const skillName = input.trim();
    if (!skillName) return;
    setSubmitting(true);
    setError(null);
    try {
      // Step 1: create or get the skill from the backend catalogue
      // POST /api/skills returns 409 if it already exists, so we catch that
      let skillId: string;
      try {
        const created: any = await request("/skills", {
          method: "POST",
          body: JSON.stringify({ skillName, category: null }),
        });
        skillId = String(created.skill?.skillId ?? created.skillId);
      } catch (err: any) {
        // 409 = skill already exists — fetch it by searching
        const catalogue: any = await request(`/skills?search=${encodeURIComponent(skillName)}`);
        const match = (catalogue.skills ?? []).find(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!match) throw new Error("Could not find or create this skill.");
        skillId = String(match.skillId);
      }

      // Step 2: add to student profile
      await request("/students/me/skills", {
        method: "POST",
        body: JSON.stringify({ skillId, proficiencyLevel: level }),
      });

      onAdd({
        studentSkillId: Date.now(),
        skillId,
        skillName,
        category: "",
        proficiencyLevel: level,
        relevantComp: 0,
        addedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add skill.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>Add a Skill</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free-text input */}
        <div className="mb-2">
          <label className="block mb-2 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
            Skill Name
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) handleAdd(); }}
              placeholder="e.g. React, Figma, Video Editing…"
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
              style={{ fontFamily: "Geist", fontSize: "15px" }}
              autoFocus
            />
          </div>
        </div>

        {/* Inline suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  input === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
                style={{ fontFamily: "Geist", fontWeight: 500 }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Spacer when no suggestions */}
        {suggestions.length === 0 && <div className="mb-5" />}

        {/* Proficiency level */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: "Geist", fontWeight: 500 }}>
            Proficiency Level
          </p>
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
                {getLevelLabel(l)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-500" style={{ fontFamily: "Geist" }}>{error}</p>
        )}

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
            disabled={!input.trim() || submitting}
            className={`flex-1 py-3 rounded-2xl text-white transition-all flex items-center justify-center gap-2 ${
              input.trim() && !submitting
                ? "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? "Adding…" : "Add Skill"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Profile page ────────────────────────────────────────────────────────
export default function Profile() {
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "posted">("overview");

  const [profile, setProfile]         = useState<ProfileData | null>(null);
  const [skills, setSkills]           = useState<SkillData[]>([]);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [postedJobs, setPostedJobs]   = useState<PostedJob[]>([]);
  const [receivedVouches, setReceivedVouches] = useState<ReceivedVouch[]>([]);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddSkill, setShowAddSkill]       = useState(false);

  useEffect(() => {
    Promise.all([
      request("/auth/me"),
      request("/students/me/skills"),
      request("/applications/mine"),
      request("/jobs/mine"),
    ])
      .then(([meRes, skillsRes, appsRes, jobsRes]: any[]) => {
        const s = meRes.student ?? null;
        if (s) {
          s.workerRating      = parseFloat(s.workerRating)      || 0;
          s.giverRating       = parseFloat(s.giverRating)       || 0;
          s.workerRatingCount = parseInt(s.workerRatingCount)   || 0;
          s.giverRatingCount  = parseInt(s.giverRatingCount)    || 0;
        }
        setProfile(s);
        setSkills((skillsRes.skills ?? []).map((s: any) => ({ ...s, skillId: String(s.skillId) })));
        setApplications(appsRes.applications ?? []);
        setPostedJobs(jobsRes.jobs ?? []);

        // Fetch vouches received using the studentId we just got
        if (s?.studentId) {
          request(`/students/${s.studentId}/vouches`)
            .then((vRes: any) => setReceivedVouches(vRes.vouches ?? []))
            .catch(() => {});
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const existingSkillIds = new Set(skills.map((s) => s.skillId));

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await request(`/students/me/skills/${skillId}`, { method: "DELETE" });
      setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    } catch (err: any) {
      alert(err.message || "Failed to remove skill.");
    }
  };

  // Completion rate derived (backend doesn't return it from /auth/me)
  const completionRate = profile
    ? profile.jobsPostedCount === 0
      ? 0
      : Math.round((profile.jobsCompletedCount / profile.jobsPostedCount) * 100)
    : 0;

  if (loading) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-red-500" style={{ fontFamily: "Geist" }}>{error ?? "Profile not found."}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      {/* ── Modals ── */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            profile={profile}
            onSave={(updated) => setProfile((p) => {
              if (!p) return p;
              const merged = { ...p, ...updated };
              merged.workerRating      = parseFloat(String(merged.workerRating))      || 0;
              merged.giverRating       = parseFloat(String(merged.giverRating))       || 0;
              merged.workerRatingCount = parseInt(String(merged.workerRatingCount))   || 0;
              merged.giverRatingCount  = parseInt(String(merged.giverRatingCount))    || 0;
              return merged;
            })}
            onClose={() => setShowEditProfile(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSkill && (
          <AddSkillModal
            existingSkillIds={existingSkillIds}
            onAdd={(skill) => setSkills((prev) => [...prev, skill])}
            onClose={() => setShowAddSkill(false)}
          />
        )}
      </AnimatePresence>

      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* ── Profile card ── */}
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
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      {profile.name}
                    </h2>
                    {profile.verifiedReviewer && (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs"
                        style={{ fontFamily: "Geist", fontWeight: 500 }}
                        title="Completed 3+ jobs — can give vouches"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mb-2" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                    {profile.rollNumber}
                  </p>
                  <div className="flex items-center gap-1.5 text-gray-600 mb-2">
                    <Mail className="w-4 h-4" />
                    <span style={{ fontFamily: "Geist", fontSize: "14px" }}>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span style={{ fontFamily: "Geist", fontSize: "13px" }}>
                      Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            {profile.bio && (
              <div className="mb-8">
                <h3 className="text-lg mb-3" style={{ fontFamily: "Geist", fontWeight: 600 }}>About</h3>
                <p className="text-gray-700" style={{ fontFamily: "Geist", fontSize: "15px", lineHeight: "1.7" }}>
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { value: profile.jobsCompletedCount, label: "Jobs Completed" },
                { value: profile.totalVouchCount,    label: "Total Vouches" },
                { value: `${completionRate}%`,        label: "Completion Rate" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{stat.value}</p>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>{stat.label}</p>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                  {profile.jobsPostedCount}
                </p>
                <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>Jobs Posted</p>
              </div>
            </div>
          </motion.div>

          {/* ── Tabs card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
          >
            {/* Tab bar */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {([
                { key: "overview",      label: "Overview",         icon: null },
                { key: "applications",  label: "My Applications",  icon: <FileText className="w-4 h-4" /> },
                { key: "posted",        label: "My Posted Jobs",   icon: <Clipboard className="w-4 h-4" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-6 py-3 flex items-center gap-2 transition-all ${
                    activeTab === key
                      ? "border-b-2 border-gray-900 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: activeTab === key ? 500 : 400 }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Ratings */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Worker rating */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <TrendingUp className="w-5 h-5" /> Rating as Worker
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                        {profile.workerRating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.workerRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: "Geist" }}>
                          Based on {profile.workerRatingCount} review{profile.workerRatingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full" style={{ width: `${(profile.workerRating / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Giver rating */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <Briefcase className="w-5 h-5" /> Rating as Job Poster
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                        {profile.giverRating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.giverRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: "Geist" }}>
                          Based on {profile.giverRatingCount} review{profile.giverRatingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full" style={{ width: `${(profile.giverRating / 5) * 100}%` }} />
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
                          key={skill.skillId}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl group"
                        >
                          <div>
                            <p style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}>{skill.skillName}</p>
                            {skill.relevantComp > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "Geist" }}>
                                {skill.relevantComp} vouch{skill.relevantComp !== 1 ? "es" : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs border ${getLevelColor(skill.proficiencyLevel)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                              {getLevelLabel(skill.proficiencyLevel)}
                            </span>
                            <button
                              onClick={() => handleRemoveSkill(skill.skillId)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center hover:bg-red-100 rounded-lg text-red-500"
                              title="Remove skill"
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

                {/* Vouches received */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl mb-6 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    <Award className="w-5 h-5" /> Vouches Received ({receivedVouches.length})
                  </h3>
                  {receivedVouches.length === 0 ? (
                    <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      No vouches yet. Complete jobs to build your reputation.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {receivedVouches.map((vouch) => (
                        <div key={vouch.vouchId} className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span style={{ fontFamily: "Geist", fontWeight: 600, fontSize: "14px" }}>
                                {vouch.voucherName?.[0] ?? "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}>
                                {vouch.voucherName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-500" style={{ fontFamily: "Geist" }}>
                                  {new Date(vouch.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </p>
                                {vouch.skillName && (
                                  <>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md" style={{ fontFamily: "Geist" }}>
                                      {vouch.skillName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {vouch.comment && (
                            <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6", paddingLeft: "52px" }}>
                              {vouch.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── Applications tab ── */}
            {activeTab === "applications" && (
              <div className="space-y-4">
                <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                  Jobs You've Applied To ({applications.length})
                </h3>
                {applications.length === 0 ? (
                  <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                    You haven't applied to any jobs yet.
                  </p>
                ) : (
                  applications.map((app) => (
                    <div key={app.applicationId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link to={`/jobs/${app.jobId}`}>
                            <h4 className="text-lg mb-1 hover:underline" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                              {app.title}
                            </h4>
                          </Link>
                          <p className="text-gray-600 text-sm mb-1" style={{ fontFamily: "Geist" }}>
                            Posted by {app.posterName}
                          </p>
                          {app.jobStatus && (
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${getJobStatusColor(app.jobStatus)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                              Job: {getJobStatusLabel(app.jobStatus)}
                            </span>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs border ${getAppStatusColor(app.status)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                          {getAppStatusLabel(app.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        {app.budget && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span style={{ fontFamily: "Geist" }}>{app.budget}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span style={{ fontFamily: "Geist" }}>
                            Applied {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Posted jobs tab ── */}
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
                  postedJobs.map((job) => (
                    <div key={job.jobId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg" style={{ fontFamily: "Geist", fontWeight: 600 }}>{job.title}</h4>
                            {job.urgent && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs" style={{ fontFamily: "Geist", fontWeight: 500 }}>
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: "Geist" }}>
                            {new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                          {job.workerName && (
                            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Geist" }}>
                              Worker: {job.workerName}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs border ${getJobStatusColor(job.status)}`} style={{ fontFamily: "Geist", fontWeight: 500 }}>
                          {getJobStatusLabel(job.status)}
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
                            <span style={{ fontFamily: "Geist" }}>{job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}</span>
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
                          {job.status === "IN_PROGRESS" && (
                            <button
                              onClick={async () => {
                                try {
                                  await request(`/jobs/${job.jobId}/complete`, { method: "PATCH" });
                                  setPostedJobs((prev) =>
                                    prev.map((j) => j.jobId === job.jobId ? { ...j, status: "COMPLETED" } : j)
                                  );
                                } catch (err: any) {
                                  alert(err.message || "Failed to mark complete.");
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