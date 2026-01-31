"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Role, PermissionSet } from "@/src/types/auth";
import { Plus, Shield, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

// The modules available in your system
const MODULES = ["user", "role", "recce", "installation"];

// Helper to generate empty permissions
const generateDefaultPermissions = () => {
  return MODULES.reduce(
    (acc, module) => {
      acc[module] = { view: false, create: false, edit: false, delete: false };
      return acc;
    },
    {} as Record<string, PermissionSet>,
  );
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    permissions: generateDefaultPermissions(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // GOLDEN RULE: External URL is PLURAL "/roles"
      const { data } = await api.get("/roles");
      setRoles(data);
    } catch (err) {
      toast.error("Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- OPEN MODAL (CREATE) ---
  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      code: "",
      permissions: generateDefaultPermissions(),
    });
    setIsModalOpen(true);
  };

  // --- OPEN MODAL (EDIT) ---
  const openEditModal = (role: Role) => {
    setEditingRole(role);

    // Merge existing permissions with defaults (in case we added new modules since the role was created)
    const mergedPermissions = {
      ...generateDefaultPermissions(),
      ...role.permissions,
    };

    setFormData({
      name: role.name,
      code: role.code,
      permissions: mergedPermissions,
    });
    setIsModalOpen(true);
  };

  // --- TOGGLE CHECKBOX ---
  const togglePermission = (module: string, action: keyof PermissionSet) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action], // Toggle boolean
        },
      },
    }));
  };

  // --- SUBMIT (CREATE OR UPDATE) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingRole) {
        // UPDATE Existing Role
        await api.put(`/roles/${editingRole._id}`, formData);
        toast.success("Role updated successfully");
      } else {
        // CREATE New Role
        await api.post("/roles", formData);
        toast.success("Role created successfully");
      }

      // Refresh list from DB to ensure accuracy
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE ROLE ---
  const handleDelete = async (roleId: string) => {
    if (
      !window.confirm(
        "Delete this role? Users assigned to this role might lose access.",
      )
    )
      return;
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(roles.filter((r) => r._id !== roleId));
      toast.success("Role deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete role");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500">
            Define access levels for different modules
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role._id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {role.name}
                    </h3>
                    <code className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                      {role.code}
                    </code>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Access Highlights
                </p>
                <div className="space-y-2">
                  {Object.entries(role.permissions)
                    .slice(0, 3)
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize text-gray-600">{key}</span>
                        <div className="flex space-x-1">
                          {/* Status Dots */}
                          <div
                            title="View"
                            className={`w-2 h-2 rounded-full ${val.view ? "bg-green-500" : "bg-gray-200"}`}
                          />
                          <div
                            title="Create"
                            className={`w-2 h-2 rounded-full ${val.create ? "bg-blue-500" : "bg-gray-200"}`}
                          />
                          <div
                            title="Edit"
                            className={`w-2 h-2 rounded-full ${val.edit ? "bg-yellow-500" : "bg-gray-200"}`}
                          />
                          <div
                            title="Delete"
                            className={`w-2 h-2 rounded-full ${val.delete ? "bg-red-500" : "bg-gray-200"}`}
                          />
                        </div>
                      </div>
                    ))}
                  {Object.keys(role.permissions).length > 3 && (
                    <p className="text-xs text-gray-400 mt-1">
                      + {Object.keys(role.permissions).length - 3} more modules
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => openEditModal(role)}
                className="text-gray-500 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </button>

              {/* Prevent deletion of Super Admin */}
              {role.code !== "super_admin" && role.code !== "SUPER_ADMIN" && (
                <button
                  onClick={() => handleDelete(role._id)}
                  className="text-gray-500 hover:text-red-600 flex items-center text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Edit Role Permissions" : "Create New Role"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Field Staff"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role Code (Unique)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FIELD_STAFF"
                // Disable editing code for existing roles to prevent breaking backend logic
                disabled={!!editingRole}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm uppercase ${editingRole ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                  })
                }
              />
            </div>
          </div>

          {/* PERMISSIONS MATRIX */}
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                Permissions Matrix
              </h4>
              <p className="text-xs text-gray-500">
                Check the boxes to grant access rights.
              </p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Module
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    View
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Create
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Edit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {MODULES.map((module) => (
                  <tr key={module} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                      {module}
                    </td>
                    {(["view", "create", "edit", "delete"] as const).map(
                      (action) => (
                        <td key={action} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                              checked={
                                formData.permissions[module]?.[action] || false
                              }
                              onChange={() => togglePermission(module, action)}
                            />
                          </div>
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {isSubmitting && (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              )}
              {editingRole ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
