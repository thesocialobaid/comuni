import { motion } from "framer-motion";
import { Mail, GraduationCap, Briefcase, Star, Edit, User, Calendar, Plus, Award, TrendingUp, FileText, Clipboard, Clock, DollarSign } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { Link } from "react-router-dom";

const profileData = {
  name: "Ali Ahmed",
  rollNumber: "20K-1234",
  email: "ali.ahmed@student.fast.edu.pk",
  campus: "Islamabad",
  year: "3rd Year",
  major: "Computer Science",
  bio: "Full-stack developer passionate about building modern web applications. Experienced in MERN stack, TypeScript, and cloud technologies. Always eager to learn new technologies and work on challenging projects.",
  workerRating: 4.8,
  workerReviews: 15,
  posterRating: 4.9,
  posterReviews: 8,
  completedJobs: 12,
  totalVouches: 18,
  completionRate: 95,
  memberSince: "January 2025",
};

const skills = [
  { name: "React", level: "Expert" },
  { name: "Node.js", level: "Advanced" },
  { name: "TypeScript", level: "Advanced" },
  { name: "MongoDB", level: "Intermediate" },
  { name: "Python", level: "Intermediate" },
  { name: "AWS", level: "Intermediate" },
  { name: "Docker", level: "Beginner" },
  { name: "Machine Learning", level: "Beginner" },
];

const vouches = [
  {
    id: 1,
    from: "Sarah Khan",
    skill: "React",
    comment: "Ali delivered exceptional React work on our e-commerce project. Highly skilled!",
    date: "April 2026",
  },
  {
    id: 2,
    from: "Hassan Raza",
    skill: "Node.js",
    comment: "Great backend developer. Built a scalable API for our mobile app.",
    date: "March 2026",
  },
  {
    id: 3,
    from: "Fatima Ahmed",
    skill: "TypeScript",
    comment: "Strong TypeScript knowledge. Code quality was excellent.",
    date: "February 2026",
  },
  {
    id: 4,
    from: "Ahmed Ali",
    skill: "Full Stack Development",
    comment: "Reliable and professional. Completed the project ahead of schedule.",
    date: "January 2026",
  },
];

const applications = [
  {
    id: 1,
    jobTitle: "Full Stack Web Developer",
    company: "Tech Startup Islamabad",
    appliedDate: "April 28, 2026",
    status: "Under Review",
    budget: "PKR 50,000 - 80,000",
  },
  {
    id: 2,
    jobTitle: "Mobile App Developer",
    company: "FinTech Company",
    appliedDate: "April 25, 2026",
    status: "Accepted",
    budget: "PKR 60,000 - 100,000",
  },
  {
    id: 3,
    jobTitle: "UI/UX Designer",
    company: "Digital Agency",
    appliedDate: "April 20, 2026",
    status: "Rejected",
    budget: "PKR 30,000 - 45,000",
  },
];

const postedJobs = [
  {
    id: 1,
    title: "Content Writer for Tech Blog",
    budget: "PKR 20,000 - 35,000",
    applicants: 8,
    status: "Open",
    postedDate: "April 15, 2026",
  },
  {
    id: 2,
    title: "React Native Developer",
    budget: "PKR 45,000 - 70,000",
    applicants: 15,
    status: "In Progress",
    postedDate: "March 10, 2026",
  },
  {
    id: 3,
    title: "Graphic Designer",
    budget: "PKR 25,000 - 40,000",
    applicants: 12,
    status: "Completed",
    postedDate: "February 5, 2026",
  },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "Expert":
      return "bg-green-100 text-green-700 border-green-200";
    case "Advanced":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Beginner":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Under Review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Accepted":
      return "bg-green-100 text-green-700 border-green-200";
    case "Rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "Open":
      return "bg-green-100 text-green-700 border-green-200";
    case "In Progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Completed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "posted">("overview");

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 mb-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex gap-6">
                <div className="w-28 h-28 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl flex items-center justify-center">
                  <User className="w-14 h-14 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl mb-2" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                    {profileData.name}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600 mb-2">
                    <span style={{ fontFamily: 'Geist', fontSize: '14px' }}>
                      Roll: {profileData.rollNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span style={{ fontFamily: 'Geist', fontSize: '14px' }}>{profileData.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span style={{ fontFamily: 'Geist', fontSize: '14px' }}>
                        {profileData.campus} Campus · {profileData.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span style={{ fontFamily: 'Geist', fontSize: '14px' }}>{profileData.major}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                style={{ fontFamily: 'Geist', fontSize: '14px', fontWeight: 500 }}
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg mb-3" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                About
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Geist', fontSize: '15px', lineHeight: '1.7' }}>
                {profileData.bio}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {profileData.completedJobs}
                </p>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Geist' }}>
                  Jobs Completed
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {profileData.totalVouches}
                </p>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Geist' }}>
                  Total Vouches
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {profileData.completionRate}%
                </p>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Geist' }}>
                  Completion Rate
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <p className="text-sm" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                    {profileData.memberSince}
                  </p>
                </div>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Geist' }}>
                  Member Since
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
          >
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 transition-all ${
                  activeTab === "overview"
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ fontFamily: 'Geist', fontSize: '15px', fontWeight: activeTab === "overview" ? 500 : 400 }}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className={`px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === "applications"
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ fontFamily: 'Geist', fontSize: '15px', fontWeight: activeTab === "applications" ? 500 : 400 }}
              >
                <FileText className="w-4 h-4" />
                My Applications
              </button>
              <button
                onClick={() => setActiveTab("posted")}
                className={`px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === "posted"
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ fontFamily: 'Geist', fontSize: '15px', fontWeight: activeTab === "posted" ? 500 : 400 }}
              >
                <Clipboard className="w-4 h-4" />
                My Posted Jobs
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                      <TrendingUp className="w-5 h-5" />
                      Rating as Worker
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                        {profileData.workerRating}
                      </div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(profileData.workerRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Geist' }}>
                          Based on {profileData.workerReviews} reviews
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
                        style={{ width: `${(profileData.workerRating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                      <Briefcase className="w-5 h-5" />
                      Rating as Job Poster
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                        {profileData.posterRating}
                      </div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(profileData.posterRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Geist' }}>
                          Based on {profileData.posterReviews} reviews
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full"
                        style={{ width: `${(profileData.posterRating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                      Skills & Proficiency
                    </h3>
                    <button
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ fontFamily: 'Geist', fontSize: '14px', fontWeight: 500 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Skill
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                      >
                        <span style={{ fontFamily: 'Geist', fontSize: '15px', fontWeight: 500 }}>
                          {skill.name}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs border ${getLevelColor(skill.level)}`}
                          style={{ fontFamily: 'Geist', fontWeight: 500 }}
                        >
                          {skill.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl flex items-center gap-2" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                      <Award className="w-5 h-5" />
                      Vouches ({profileData.totalVouches})
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {vouches.map((vouch) => (
                      <div
                        key={vouch.id}
                        className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span style={{ fontFamily: 'Geist', fontWeight: 600, fontSize: '14px' }}>
                                {vouch.from.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Geist', fontWeight: 500, fontSize: '15px' }}>
                                {vouch.from}
                              </p>
                              <p className="text-xs text-gray-600" style={{ fontFamily: 'Geist' }}>
                                {vouch.date}
                              </p>
                            </div>
                          </div>
                          <span
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs border border-blue-200"
                            style={{ fontFamily: 'Geist', fontWeight: 500 }}
                          >
                            {vouch.skill}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm" style={{ fontFamily: 'Geist', lineHeight: '1.6' }}>
                          {vouch.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "applications" && (
              <div className="space-y-4">
                <h3 className="text-xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  Jobs You've Applied To ({applications.length})
                </h3>
                {applications.map((app) => (
                  <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link to={`/jobs/${app.id}`}>
                          <h4 className="text-lg mb-1 hover:underline" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                            {app.jobTitle}
                          </h4>
                        </Link>
                        <p className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Geist' }}>
                          {app.company}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(app.status)}`}
                        style={{ fontFamily: 'Geist', fontWeight: 500 }}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span style={{ fontFamily: 'Geist' }}>{app.budget}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span style={{ fontFamily: 'Geist' }}>Applied {app.appliedDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "posted" && (
              <div className="space-y-4">
                <h3 className="text-xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  Jobs You've Posted ({postedJobs.length})
                </h3>
                {postedJobs.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg mb-1" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                          {job.title}
                        </h4>
                        <p className="text-gray-600 text-sm" style={{ fontFamily: 'Geist' }}>
                          Posted on {job.postedDate}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(job.status)}`}
                        style={{ fontFamily: 'Geist', fontWeight: 500 }}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span style={{ fontFamily: 'Geist' }}>{job.budget}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span style={{ fontFamily: 'Geist' }}>{job.applicants} applicants</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
