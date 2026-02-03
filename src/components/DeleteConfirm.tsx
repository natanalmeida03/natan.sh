"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmProps {
   title?: string;
   message?: string;
   onConfirm: () => Promise<void>;
   trigger?: React.ReactNode;
}

export default function DeleteConfirm({
   title = "Delete",
   message = "Are you sure? This action cannot be undone.",
   onConfirm,
   trigger,
}: DeleteConfirmProps) {
   const [open, setOpen] = useState(false);
   const [loading, setLoading] = useState(false);

   async function handleConfirm() {
      setLoading(true);
      await onConfirm();
      setLoading(false);
      setOpen(false);
   }

   return (
      <>
         {trigger ? (
            <div onClick={() => setOpen(true)}>{trigger}</div>
         ) : (
            <button
               onClick={() => setOpen(true)}
               className="px-3 py-2 border-2 border-red-500 text-red-500 rounded-lg font-medium text-xs sm:text-sm hover:bg-red-500 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
            >
               <Trash2 size={14} />
               {title}
            </button>
         )}

         {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setOpen(false)}
               />
               <div className="relative bg-[#F8F4EE] border border-[#2E2E2E]/15 rounded-xl p-5 w-full max-w-sm shadow-xl">
                  <p className="text-sm text-[#2E2E2E] font-semibold mb-1">{title}</p>
                  <p className="text-xs sm:text-sm text-[#2E2E2E]/70 mb-4">{message}</p>

                  <div className="flex gap-2">
                     <button
                        onClick={() => setOpen(false)}
                        className="flex-1 px-4 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#2E2E2E] hover:text-[#F8F4EE] transition-colors cursor-pointer"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        <Trash2 size={14} />
                        {loading ? "..." : "Delete"}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </>
   );
}