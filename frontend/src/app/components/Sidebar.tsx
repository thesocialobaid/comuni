import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, PlusCircle, User, LogOut, X } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, toggleSidebar } = useSidebar();

  const navItems = [
    { path: "/jobs", label: "Job Feed", icon: Briefcase },
    { path: "/post-job", label: "Post a Job", icon: PlusCircle },
    { path: "/profile", label: "My Profile", icon: User },
  ];

  function handleLogout() {
    localStorage.removeItem("token");
    toggleSidebar();
    navigate("/login");
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={toggleSidebar}
      />
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200 p-6 flex flex-col z-50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
            Menu
          </h2>
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={toggleSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={{ fontFamily: 'Geist', fontSize: '15px', fontWeight: isActive ? 500 : 400 }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all w-full"
          style={{ fontFamily: 'Geist', fontSize: '15px' }}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </aside>
    </>
  );
}