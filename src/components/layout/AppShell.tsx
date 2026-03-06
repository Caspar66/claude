import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { LeftNav } from './LeftNav';

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftNav />
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
