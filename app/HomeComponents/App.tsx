'use client'

import React, { useState } from 'react';
import { Navigation } from './SideBar';
import { Dashboard } from './Dashboard';
import { Utilities } from './Utilities';
import { AccessControl } from './AccessControl';
import { Forum } from './Forum';
import { Events } from './Events';
import TenantManagement from './TenantManagement';
import { Auth } from '../LandingPageComponents/Auth';
import { ViewState, User } from '../types';
import JoinRequestsPage from './JoinRequestPage';
import { InvoicesPage } from './Invoices';

export default function App() {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView(ViewState.DASHBOARD);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // const handleSwitchUser = async (role: Role) => {
  //   // Demo helper to switch roles easily by finding the first user of that role in DB
  //   const users = db.getAllUsers();
  //   const targetUser = users.find(u => u.role === role);
  //   if (targetUser) {
  //       const { password, ...safeUser } = targetUser;
  //       setCurrentUser(safeUser);
  //       setView(ViewState.DASHBOARD);
  //   } else {
  //       alert(`No user found with role: ${role}`);
  //   }
  // };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard setView={setView} currentUser={currentUser} />;
      case ViewState.UTILITIES:
        return <Utilities currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
      case ViewState.INVOICES:
        return <InvoicesPage currentUserId={currentUser.id}/>;
      case ViewState.ACCESS:
        return <AccessControl currentUser={currentUser} />;
      case ViewState.FORUM:
        return <Forum currentUser={currentUser} />;
      case ViewState.EVENTS:
        return <Events currentUser={currentUser} />;
      case ViewState.USERS:
        return <TenantManagement /> ;
      case ViewState.REQUESTS:
        return <JoinRequestsPage /> ;
      default:
        return <Dashboard setView={setView} currentUser={currentUser} />;
    }
  };

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="flex min-h-screen w-full bg-green-300">
      <Navigation 
        currentView={currentView} 
        setView={setView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 p-12 mx-auto bg-blue-100 animate-fade-in mb-16 md:mb-0">
        {renderContent()}
      </main>
    </div>
  );
}