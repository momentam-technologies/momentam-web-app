"use client";
import React, { useState, useEffect } from 'react';
import { getAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser } from '@/lib/appwrite';
import { useSession } from 'next-auth/react';

const AdminsPage = () => {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'admin' });

  useEffect(() => {
    const fetchAdmins = async () => {
      const { admins } = await getAdminUsers();
      setAdmins(admins);
    };
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (session.user.role !== 'superadmin') {
      alert('Only super admins can add new admins.');
      return;
    }
    await addAdminUser(newAdmin);
    setNewAdmin({ name: '', email: '', role: 'admin' });
    const { admins } = await getAdminUsers();
    setAdmins(admins);
  };

  return (
    <div>
      <h1>Admin Management</h1>
      {session.user.role === 'superadmin' && (
        <div>
          <h2>Add New Admin</h2>
          <input
            type="text"
            placeholder="Name"
            value={newAdmin.name}
            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
          />
          <button onClick={handleAddAdmin}>Add Admin</button>
        </div>
      )}
      <h2>Existing Admins</h2>
      <ul>
        {admins.map((admin) => (
          <li key={admin.$id}>
            {admin.name} ({admin.role})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminsPage;
