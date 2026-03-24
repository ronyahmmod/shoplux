"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPwSuccess("Password updated successfully");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-sm text-gray-400">{session?.user?.email}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">
          Change Password
        </h2>
        {pwError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            ✓ {pwSuccess}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            {
              key: "current",
              label: "Current Password",
              placeholder: "Enter current password",
            },
            {
              key: "newPw",
              label: "New Password",
              placeholder: "At least 8 characters",
            },
            {
              key: "confirm",
              label: "Confirm Password",
              placeholder: "Repeat new password",
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {label}
              </label>
              <input
                type="password"
                required
                placeholder={placeholder}
                value={pwForm[key]}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {pwLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
