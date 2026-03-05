/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import localforage from 'localforage';
import { UserContextType } from './types';
import { useRouter } from 'next/navigation';
import { User } from './types';



interface UnifiedUserContextType extends UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UnifiedUserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);

//   const [isConnected, setIsConnected] = useState(false);
//   const [notifications, setNotifications] = useState<CleanNotification[]>([]);
//   const badgeCount = notifications.length;

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const storedUser = await localforage.getItem<User>('userData');
//         if (storedUser) {
//           setUser(storedUser);
//           // console.log('Persistence: User reloaded from localforage');
//         }
//       } catch (err) {
//         console.error('Failed to load user from storage:', err);
//       }
//     };

//     loadUser();
//   }, []);

  // useEffect(() => {
  //   async function cSessionCheck() {
  //     try {
  //       const res = await checkSession();

  //       // Changed res.ok to res.success
  //       if (!res.success) {
  //         console.warn('Session invalid, redirecting...');
  //         window.location.replace('/');
  //       } else {
  //         // console.log('Session verified for:', res.user?.firstName);
  //       }
  //     } catch (err) {
  //       console.error('Session check failed:', err);
  //       window.location.replace('/');
  //     }
  //   }

  //   cSessionCheck();
  // }, []); 

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
        setUser
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
