import { request } from "../../api/client";
import { motion, AnimatePresence } from "motion/react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  AlertCircle,
  Plus,
  Loader2,
  CheckCircle,
  Zap,
} from "lucide-react";

// ─── Mock skill catalogue (mirrors GET /api/skills) ─────────────────────────
const MOCK_SKILLS = [
  { id: 1, name: "React" },
  { id: 2, name: "Node.js" },
  { id: 3, name: "TypeScript" },
  { id: 4, name: "Python" },
  { id: 5, name: "Django" },
  { id: 6, name: "FastAPI" },
  { id: 7, name: "MongoDB" },
  { id: 8, name: "PostgreSQL" },
  { id: 9, name: "MySQL" },
  { id: 10, name: "Flutter" },
  { id: 11, name: "React Native" },
  { id: 12, name: "Figma" },
  { id: 13, name: "Adobe XD" },
  { id: 14, name: "UI Design" },
  { id: 15, name: "Machine Learning" },
  { id: 16, name: "TensorFlow" },
  { id: 17, name: "PyTorch" },
  { id: 18, name: "AWS" },
  { id: 19, name: "Docker" },
  { id: 20, name: "GraphQL" },
  { id: 21, name: "Next.js" },
  { id: 22, name: "Vue.js" },
  { id: 23, name: "SEO" },
  { id: 24, name: "Copywriting" },
  { id: 25, name: "Data Analysis" },
];

const PROFICIENCY_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
type ProficiencyLevel = typeof PROFICIENCY_LEVELS[number];

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

const PROFICIENCY_COLORS: Record<ProficiencyLevel, string> = {
  BEGINNER: "bg-gray-100 text-gray-700 border-gray-200",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADVANCED: "bg-blue-100 text-blue-700 border-blue-200",
  EXPERT: "bg-green-100 text-green-700 border-green-200",
};

interface ApiSkill {
  id: number;
  name: string;
}

interface AddedSkill {
  skillId: number;
  name: string;
  isMandatory: boolean;
  minProficiencyLevel: ProficiencyLevel;
}



export default function PostJob() {
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urgent, setUrgent] = useState(false);

  // ── Skills catalogue ────────────────────────────────────────────────────────
  const [allSkills, setAllSkills] = useState<ApiSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // ── Skill picker state ──────────────────────────────────────────────────────
  const [skillSearch, setSkillSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingSkill, setPendingSkill] = useState<ApiSkill | null>(null);
  const [pendingLevel, setPendingLevel] = useState<ProficiencyLevel>("INTERMEDIATE");
  const [pendingMandatory, setPendingMandatory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Added skills ─────────────────────────────────────────────────────────────
  const [addedSkills, setAddedSkills] = useState<AddedSkill[]>([]);

  // ── Submit state ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Load skills ──────────────────────────────────────────────────────────────
  useEffect(() => {
  request("/skills")
  .then((d: any) => {
    const mapped = (d.skills ?? []).map((s: any) => ({
      id: s.skillId,
      name: s.skillName,
    }));
    setAllSkills(mapped);
    setSkillsLoading(false);
  })
  .catch(() => setSkillsLoading(false));
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered skills (exclude already added) ──────────────────────────────────
  const addedIds = new Set(addedSkills.map((s) => s.skillId));
  const filteredSkills = allSkills.filter(
    (s) =>
      !addedIds.has(s.id) &&
      s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const handleSelectSkill = (skill: ApiSkill) => {
    setPendingSkill(skill);
    setSkillSearch(skill.name);
    setDropdownOpen(false);
    setPendingLevel("INTERMEDIATE");
    setPendingMandatory(false);
  };

  const handleAddSkill = () => {
    if (!pendingSkill) return;
    setAddedSkills((prev) => [
      ...prev,
      {
        skillId: pendingSkill.id,
        name: pendingSkill.name,
        isMandatory: pendingMandatory,
        minProficiencyLevel: pendingLevel,
      },
    ]);
    setPendingSkill(null);
    setSkillSearch("");
    setPendingLevel("INTERMEDIATE");
    setPendingMandatory(false);
  };

  const handleRemoveSkill = (skillId: number) => {
    setAddedSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      budget: budget ? Number(budget) : undefined,
      deadline: deadline || undefined,
      urgent,
      skills: addedSkills.map(({ skillId, isMandatory, minProficiencyLevel }) => ({
        skillId,
        isMandatory,
        minProficiencyLevel,
      })),
    };

    try {
      await request("/jobs", {
        method: "POST",
        body: JSON.stringify(payload),
     });
      setSubmitSuccess(true);
      setTimeout(() => navigate("/jobs"), 1500);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-5 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

  const labelClass = "block mb-2 text-gray-800";

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Page heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <h1
              className="text-4xl mb-2"
              style={{ fontFamily: "Geist", fontWeight: 600 }}
            >
              Post a New Job
            </h1>
            <p
              className="text-gray-500"
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            >
              Fill in the details below and find the right talent at FAST.
            </p>
          </motion.div>

          {/* Glass card form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* ── Title ────────────────────────────────────────────────── */}
              <div>
                <label
                  className={labelClass}
                  style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                >
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Web Developer"
                  className={inputClass}
                  style={{ fontFamily: "Geist", fontSize: "15px" }}
                />
              </div>

              {/* ── Description ──────────────────────────────────────────── */}
              <div>
                <label
                  className={labelClass}
                  style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                >
                  Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the project, deliverables, and any specific requirements…"
                  className={`${inputClass} resize-none`}
                  style={{ fontFamily: "Geist", fontSize: "15px" }}
                />
              </div>

              {/* ── Budget + Deadline (side by side) ─────────────────────── */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label
                    className={labelClass}
                    style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                  >
                    Budget (PKR)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 select-none"
                      style={{ fontFamily: "Geist", fontSize: "14px" }}
                    >
                      ₨
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 50000"
                      className={`${inputClass} pl-9`}
                      style={{ fontFamily: "Geist", fontSize: "15px" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={labelClass}
                    style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                  >
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={inputClass}
                    style={{ fontFamily: "Geist", fontSize: "15px" }}
                  />
                </div>
              </div>

              {/* ── Urgent toggle ─────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 py-4 bg-white/70 border border-gray-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${urgent ? "bg-red-100" : "bg-gray-100"}`}>
                    <Zap className={`w-4 h-4 ${urgent ? "text-red-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p
                      className="text-gray-900"
                      style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}
                    >
                      Mark as Urgent
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: "Geist", fontSize: "13px" }}
                    >
                      Highlights the listing with an urgent badge
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setUrgent((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    urgent ? "bg-red-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      urgent ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* ── Skills section ────────────────────────────────────────── */}
              <div>
                <label
                  className={`${labelClass} mb-3`}
                  style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                >
                  Required Skills
                </label>

                {/* Skill search dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => {
                        setSkillSearch(e.target.value);
                        setPendingSkill(null);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder={skillsLoading ? "Loading skills…" : "Search and pick a skill…"}
                      disabled={skillsLoading}
                      className={`${inputClass} pl-11 pr-10`}
                      style={{ fontFamily: "Geist", fontSize: "15px" }}
                    />
                    {skillsLoading && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {!skillsLoading && skillSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setSkillSearch("");
                          setPendingSkill(null);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {dropdownOpen && filteredSkills.length > 0 && skillSearch && !pendingSkill && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                      >
                        <div className="max-h-52 overflow-y-auto">
                          {filteredSkills.slice(0, 10).map((skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              onMouseDown={() => handleSelectSkill(skill)}
                              className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors"
                              style={{ fontFamily: "Geist", fontSize: "14px" }}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Proficiency + Mandatory (shown after picking a skill) */}
                <AnimatePresence>
                  {pendingSkill && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                        {/* Skill name header */}
                        <div className="flex items-center justify-between">
                          <p
                            className="text-gray-900"
                            style={{ fontFamily: "Geist", fontWeight: 600, fontSize: "15px" }}
                          >
                            {pendingSkill.name}
                          </p>
                        </div>

                        {/* Proficiency selector */}
                        <div>
                          <p
                            className="mb-2 text-gray-600"
                            style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}
                          >
                            Minimum Proficiency Level
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {PROFICIENCY_LEVELS.map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setPendingLevel(level)}
                                className={`px-4 py-1.5 rounded-xl border text-xs transition-all ${
                                  pendingLevel === level
                                    ? PROFICIENCY_COLORS[level] + " ring-2 ring-offset-1 ring-gray-300"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                                }`}
                                style={{ fontFamily: "Geist", fontWeight: 500 }}
                              >
                                {PROFICIENCY_LABELS[level]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mandatory toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className="text-gray-800"
                              style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "14px" }}
                            >
                              Mandatory Skill
                            </p>
                            <p
                              className="text-gray-500"
                              style={{ fontFamily: "Geist", fontSize: "12px" }}
                            >
                              Applicants must have this skill to apply
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingMandatory((v) => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                              pendingMandatory ? "bg-gray-900" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                                pendingMandatory ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Add button */}
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                          style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                        >
                          <Plus className="w-4 h-4" />
                          Add Skill
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Added skills tags */}
                <AnimatePresence>
                  {addedSkills.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2 mt-3"
                    >
                      {addedSkills.map((skill) => (
                        <motion.div
                          key={skill.skillId}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.15 }}
                          className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border ${PROFICIENCY_COLORS[skill.minProficiencyLevel]}`}
                        >
                          <span style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
                            {skill.name}
                          </span>
                          <span
                            className="opacity-70"
                            style={{ fontFamily: "Geist", fontSize: "11px" }}
                          >
                            {PROFICIENCY_LABELS[skill.minProficiencyLevel]}
                          </span>
                          {skill.isMandatory && (
                            <span
                              className="px-1.5 py-0.5 bg-black/10 rounded-md"
                              style={{ fontFamily: "Geist", fontSize: "10px", fontWeight: 600 }}
                            >
                              REQ
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.skillId)}
                            className="ml-1 hover:opacity-70 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Error message ─────────────────────────────────────────── */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-700"
                    style={{ fontFamily: "Geist", fontSize: "14px" }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Submit button ─────────────────────────────────────────── */}
              <motion.button
                type="submit"
                disabled={submitting || submitSuccess || !title.trim()}
                whileHover={!submitting && !submitSuccess ? { scale: 1.015 } : {}}
                whileTap={!submitting && !submitSuccess ? { scale: 0.985 } : {}}
                className={`w-full py-4 rounded-2xl text-white flex items-center justify-center gap-3 transition-all ${
                  submitSuccess
                    ? "bg-green-600"
                    : !title.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222]"
                }`}
                style={{
                  fontFamily: "Geist",
                  fontSize: "16px",
                  fontWeight: 600,
                  boxShadow: submitSuccess || !title.trim()
                    ? "none"
                    : "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24), 0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting…
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Posted! Redirecting…
                  </>
                ) : (
                  "Post Job"
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
