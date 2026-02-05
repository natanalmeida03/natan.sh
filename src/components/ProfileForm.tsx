"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword, deleteAccount } from "@/lib/profile";
import { Trash2, Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
   initialUsername?: string;
}

function ProfileForm({ initialUsername = "" }: ProfileFormProps) {
   const router = useRouter();

   const [username, setUsername] = useState(initialUsername);
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

   async function handleUpdateUsername(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("username", username);

      const result = await updateProfile(formData);

      if (result.error) {
         setMessage({ type: "error", text: result.error });
      } else {
         setMessage({ type: "success", text: "Username updated successfully!" });
      }

      setUsername("")
      setLoading(false);
   }

   async function handleUpdatePassword(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setMessage(null);

      if (password !== confirmPassword) {
         setMessage({ type: "error", text: "Passwords don't match" });
         setLoading(false);
         return;
      }

      const formData = new FormData();
      formData.append("password", password);
      formData.append("confirm_password", confirmPassword);

      const result = await updatePassword(formData);

      if (result.error) {
         setMessage({ type: "error", text: result.error });
      } else {
         setMessage({ type: "success", text: "Password updated successfully!" });
         setPassword("");
         setConfirmPassword("");
      }

      setLoading(false);
   }

   async function handleDeleteAccount() {
      setLoading(true);
      setMessage(null);

      const result = await deleteAccount();

      if (result.error) {
         setMessage({ type: "error", text: result.error });
         setLoading(false);
      } else {
         router.push("/");
      }
   }

   return (
      <div className="relative mt-4 lg:mt-16 w-full flex-1 flex flex-col">
         <div className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-0 sm:px-4 md:px-8 w-full flex-1 flex flex-col">

            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6">
               Edit Profile
            </h2>

            {/* Message */}
            {message && (
               <div className={`mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-lg flex items-center justify-between ${
                  message.type == "success"
                     ? "border border-green-400 bg-green-50"
                     : "border border-red-400 bg-red-50"
               }`}>
                  <div className="flex items-center gap-2">
                     <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                        color={message.type == "success" ? "green" : "red"}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                     <span className={`text-xs sm:text-sm ${
                        message.type == "success"
                           ? "text-green-700"
                           : "text-red-700"
                     }`}>{message.text}</span>
                  </div>
                  <button
                     onClick={() => setMessage(null)}
                     className={`shrink-0 ml-2 ${message.type == "success"
                        ? "text-green-500 hover:text-green-700 cursor-pointer"
                        : "text-red-500 hover:text-red-700 cursor-pointer"
                     }`}
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>
               </div>
            )}

            {/* Username Form */}
            <form onSubmit={handleUpdateUsername} className="mb-4 sm:mb-6">
               <fieldset className="border border-foreground rounded-lg px-3 pb-2 pt-0">
                  <legend className="text-xs text-foreground px-1">username</legend>
                  <input
                     type="text"
                     name="username"
                     id="username"
                     required
                     placeholder="new username"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm"
                  />
               </fieldset>
               <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full sm:w-auto sm:min-w- md:max-w-44 px-4 py-2 bg-foreground text-background rounded-lg font-medium text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
               >
                  Save
               </button>
            </form>

            {/* Password Form */}
            <form onSubmit={handleUpdatePassword} className="mb-4 sm:mb-6 flex-1">
               <fieldset className="border border-foreground rounded-lg px-3 pb-2 pt-0 mb-3">
                  <legend className="text-xs text-foreground px-1">new password</legend>
                  <div className="flex items-center">
                     <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm min-w-0"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-foreground hover:text-muted transition-colors cursor-pointer shrink-0 ml-2"
                     >
                        {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
               </fieldset>

               <fieldset className="border border-foreground rounded-lg px-3 pb-2 pt-0">
                  <legend className="text-xs text-foreground px-1">confirm password</legend>
                  <div className="flex items-center">
                     <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        id="confirm_password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-transparent text-foreground focus:outline-none py-1 font-mono text-sm min-w-0"
                     />
                     <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-foreground hover:text-muted transition-colors cursor-pointer shrink-0 ml-2"
                     >
                        {!showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
               </fieldset>

               <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full sm:w-auto sm:min-w- md:max-w-44 px-4 py-2 bg-foreground text-background rounded-lg font-medium text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
               >
                  Update password
               </button>
            </form>

            {/* Delete Account */}
            <div className="mt-auto pt-4 border-t border-foreground/20">
               {!showDeleteConfirm ? (
                  <button
                     onClick={() => setShowDeleteConfirm(true)}
                     className="w-full px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg font-medium text-xs sm:text-sm hover:bg-red-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                     <Trash2 size={16} />
                     Delete account
                  </button>
               ) : (
                  <div className="space-y-2">
                     <p className="text-xs sm:text-sm text-red-600 font-medium text-center">
                        Are you sure? This action cannot be undone.
                     </p>
                     <div className="flex flex-col xs:flex-row gap-2">
                        <button
                           onClick={() => setShowDeleteConfirm(false)}
                           className="flex-1 px-4 py-2 border-2 border-foreground text-foreground rounded-lg font-medium text-xs sm:text-sm hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handleDeleteAccount}
                           disabled={loading}
                           className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           <Trash2 size={16} />
                           Confirm
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default ProfileForm;
