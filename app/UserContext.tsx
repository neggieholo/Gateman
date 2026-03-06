/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import localforage from 'localforage';
import { UserContextType } from './types';
import { User } from './types';
import { flushAllTraces } from 'next/dist/trace';



interface UnifiedUserContextType extends UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const UserContext = createContext<UnifiedUserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const [isConnected, setIsConnected] = useState(false);
//   const [notifications, setNotifications] = useState<CleanNotification[]>([]);
//   const badgeCount = notifications.length;


//   useEffect(() => {
//     const newSocket = io('http://localhost:3066', {
//       path: '/api/socket.io',
//       withCredentials: true,
//       autoConnect: true,
//       reconnectionAttempts: 5,
//     });

//     newSocket.on('connect', () => setIsConnected(true));
//     newSocket.on('onlineCheck', (users) => setOnlineMembers(users));
    

//     newSocket.on('notification_deleted', (id: string) => {
//       setNotifications((prev) => prev.filter((n) => n._id !== id));
//     });

   
//       });
//     };

//     newSocket.on('messages', (data) => {
//       setNotifications((prev) => {
//         const incoming = Array.isArray(data) ? data : [data];
//         const combined = [...incoming, ...prev];
//         return combined.filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
//       });
//     });

//     socketRef.current = newSocket;
//     return () => {
//       newSocket.close();
//     };
//   }, []);


  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isSidebarOpen, 
        setIsSidebarOpen
      }}
    >
      {children}
    </UserContext.Provider>
  );
};;

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
