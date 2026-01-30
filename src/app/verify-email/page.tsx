import Link from "next/link";

function VerifyEmailPage () {

   
   return (
      <div className="bg-[#F8F4EE] h-dvh flex">
      <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
        <h1 className="flex text-[#2E2E2E]"><b>register</b>@ubuntu:~$ </h1>
        <div className="mt-6">
          <div className="">
            {/* <Link href={'/login'} className="flex-2 py-1 px-3 border border-[#2E2E2E] text-foreborder-[#2E2E2E] rounded-md b">SignIn</Link> */}
            {'>'} email sent to your address <br />
            {'>'} click the link to activate your account <br />
            {'>'} back to <Link href={'/login'} className="text-pink-600">Login</Link>
          </div>
        </div>
      </main>
    </div>
   )
}

export default VerifyEmailPage;