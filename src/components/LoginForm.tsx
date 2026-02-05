"use client"
import {useState} from 'react'
import Link from 'next/link'
import {login, loginWithGoogle} from '@/lib/auth'
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function LoginForm (){
   const router = useRouter();

   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")

   const [showPassword, setShowPassword] = useState(false)

   const [isLoading, setIsLoading] = useState(false);
   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();

      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password)

      const result = await login(formData);

      if (result?.error) {
         setError(result.error);
         setIsLoading(false);
         return;
      }

      if (result?.success) {
         router.push("/home");
      }
   }

   async function handleGoogleLogin() {
      setIsGoogleLoading(true);
      setError(null);

      const result = await loginWithGoogle();

      if (result?.error) {
         setError(result.error);
         setIsGoogleLoading(false);
      }
   }

   return (
      <div className='w-full'>
         {error && (
            <div className="mb-4 sm:mb-5 p-2.5 sm:p-3 border border-red-400 bg-red-50 rounded-lg flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <svg
                     className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0"
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
                  <span className="text-red-700 text-xs sm:text-sm">{error}</span>
               </div>
               <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 cursor-pointer shrink-0 ml-2"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>
         )}
         <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-5'>
            <fieldset className="border border-foreground rounded-lg px-3 pb-2 pt-0">
               <legend className="text-xs text-foreground px-1">email</legend>
               <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder='your@email.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-foreground focus:outline-none py-1 text-sm sm:text-base"
               />
            </fieldset>

            <fieldset className="border border-foreground rounded-lg px-3 pb-2 pt-0 w-full flex items-center ">
               <legend className="text-xs text-foreground px-1">password</legend>
               <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  required
                  placeholder='********'
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-foreground focus:outline-none py-1 flex-1 text-sm sm:text-base min-w-0"
               />
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-foreground hover:text-muted transition-colors cursor-pointer shrink-0 ml-2"
               >
                  {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
            </fieldset>
            <div className='my-auto flex gap-2 sm:gap-3 w-full'>
               <Link href={'/register'} className='flex-1 py-1.5 sm:py-1 px-2 sm:px-3 border border-foreground text-foreground rounded-md text-center text-sm sm:text-base'>SignUp</Link>
               <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-foreground border-foreground flex-2 sm:flex-3 py-1.5 sm:py-1 px-2 sm:px-3 border rounded-md text-background hover:bg-background hover:text-foreground cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
               >
                  {!isLoading ? "Login" : "processing..."}
               </button>
            </div>
         </form>
         <div className="flex items-center gap-3 sm:gap-4 py-5 sm:py-6 text-foreground">
            <hr className="flex-1 border-t border-foreground" />
            <span className="text-xs sm:text-sm">or</span>
            <hr className="flex-1 border-t border-foreground" />
         </div>
         <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className='w-full cursor-pointer border border-foreground rounded-md py-2 px-3 sm:px-5 flex hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
         >
            <div className='flex gap-3 sm:gap-5 items-center'>
               <img src="google.png" alt="Google" className='w-4 h-4 sm:w-5 sm:h-5 object-contain'/>
               <p className='text-sm sm:text-base'>{!isGoogleLoading ? "SignIn with Google" : "Connecting..."}</p>
            </div>
         </button>
      </div>
   )
}

export default LoginForm;
