import { FocusProvider } from '../context/FocusContext';
import FocusDock from '../components/FocusDock';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// Shell for all logged-in pages: sidebar (desktop) / bottom tabs (mobile),
// top navbar, and the routed page in the middle.
export default function AppLayout() {
  return (
    <FocusProvider><div className="min-h-screen md:pl-60">
      <Sidebar />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
        <Outlet />
      </main>
      <FocusDock />
    </div></FocusProvider>
  );
}
