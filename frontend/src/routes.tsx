import { createBrowserRouter } from "react-router-dom";
import Home from "./app/pages/Home";
import Login from "./app/pages/Login";
import Signup from "./app/pages/Signup";
import JobFeed from "./app/pages/JobFeed";
import JobDetail from "./app/pages/JobDetail";
import Profile from "./app/pages/Profile";
import PostJob from "./app/pages/PostJob";
import ErrorBoundary from "./app/components/ErrorBoundary";
import ProtectedRoute from "./app/components/protectedroutes";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },

  // 🔒 PROTECTED GROUP
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/jobs",
        Component: JobFeed,
      },
      {
        path: "/jobs/:id",
        Component: JobDetail,
      },
      {
        path: "/profile",
        Component: Profile,
      },
      {
        path: "/post-job",
        Component: PostJob,
      },
    ],
  },
]);