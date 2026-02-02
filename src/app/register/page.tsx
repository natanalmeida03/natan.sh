import RegisterForm from "@/components/RegisterForm";

function RegisterPage () {

   
   return (
      <div className="bg-[#F8F4EE] min-h-dvh flex">
      <main className="bg-[#F8F4EE] w-full max-w-[90%] sm:max-w-[85%] lg:max-w-5/6 mx-auto flex flex-col py-8 sm:py-12 md:py-16">
        <h1 className="flex-1 text-[#2E2E2E] text-sm sm:text-base"><b>register</b>@ubuntu:~$ </h1>
        <div className="flex-3 flex justify-center items-center px-2 sm:px-0">
          <div className="my-auto w-full max-w-full sm:max-w-[70%] md:max-w-[50%] lg:max-w-[35%]">
            <RegisterForm />
          </div>
        </div>
      </main>
    </div>
   )
}

export default RegisterPage;