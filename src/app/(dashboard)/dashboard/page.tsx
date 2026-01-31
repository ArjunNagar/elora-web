"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { User, Role } from "@/src/types/auth";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast"; // IMPORT TOAST

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);

      setUsers(usersRes.data.users || usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      setError("Failed to load data. Please check permissions.");
      toast.error("Could not load users."); // Toast error
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", roleId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.role?._id || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      let savedUser;

      if (editingUser) {
        // --- UPDATE MODE ---
        const { data } = await api.put(`/users/${editingUser._id}`, payload);
        savedUser = data.user;

        const roleObj = roles.find((r) => r._id === payload.roleId);
        const updatedUserWithRole = { ...savedUser, role: roleObj };

        setUsers(
          users.map((u) =>
            u._id === editingUser._id ? updatedUserWithRole : u,
          ),
        );
        toast.success("User updated successfully!"); // SUCCESS TOAST
      } else {
        // --- CREATE MODE ---
        const { data } = await api.post("/users", payload);
        savedUser = data.user;

        const roleObj = roles.find((r) => r._id === payload.roleId);
        const newUserWithRole = { ...savedUser, role: roleObj };

        setUsers([...users, newUserWithRole]);
        toast.success("User created successfully!"); // SUCCESS TOAST
      }

      setIsModalOpen(false);
    } catch (error: any) {
      // ERROR TOAST
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("User deleted successfully"); // SUCCESS TOAST
    } catch (error) {
      toast.error("Failed to delete user"); // ERROR TOAST
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">
            Manage admin and field staff access
          </p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-medium text-white hover:bg-blue-700 transition-colors"
          onClick={openCreateModal}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* User List (Desktop Table) */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {user.role?.name || "No Role"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isActive ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />{" "}
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-red-800">
                      <XCircle className="h-3 w-3 mr-1 text-red-500" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User List (Mobile Cards) */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white p-4 rounded-lg shadow border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {user.name}
                  </h3>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => openEditModal(user)}
                  className="text-blue-500"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                {user.role?.name || "No Role"}
              </span>
              {user.isActive ? (
                <span className="text-green-600 font-medium">Active</span>
              ) : (
                <span className="text-red-600 font-medium">Inactive</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL (Create/Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Create New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password{" "}
              {editingUser && (
                <span className="text-gray-400 font-normal">
                  (Leave blank to keep current)
                </span>
              )}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={editingUser ? "••••••••" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assign Role
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={formData.roleId}
              onChange={(e) =>
                setFormData({ ...formData, roleId: e.target.value })
              }
            >
              <option value="">Select a Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              )}
              {editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
