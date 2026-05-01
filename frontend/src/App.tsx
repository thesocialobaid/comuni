import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { SidebarProvider } from './app/contexts/SidebarContext';

export default function App() {
  return (
    <SidebarProvider>
      <RouterProvider router={router} />
    </SidebarProvider>
  );
}