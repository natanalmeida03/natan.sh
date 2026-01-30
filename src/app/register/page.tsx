import RegisterForm from "@/components/RegisterForm";

function RegisterPage () {

   
   return (
      <div className="bg-[#F8F4EE] h-dvh flex">
      <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
        <h1 className="flex-1 text-[#2E2E2E]"><b>register</b>@ubuntu:~$ </h1>
        <div className="flex-3 flex justify-center ">
          <div className="my-auto w-full max-w-4/12 ">
            {/* <Link href={'/login'} className="flex-2 py-1 px-3 border border-[#2E2E2E] text-foreborder-[#2E2E2E] rounded-md b">SignIn</Link> */}
            <RegisterForm />
          </div>
        </div>
      </main>
    </div>
   )
}

export default RegisterPage;