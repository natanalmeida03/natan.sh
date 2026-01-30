import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#F8F4EE] h-dvh flex">
      <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
        <div className="flex gap-4 items-center justify-between">
          <h1 className="text-[#2E2E2E]">./natan.sh</h1>
          <div className="flex gap-3">
            <Link href={'/login'} className="flex-2 py-1 px-3 border border-transparent hover:border hover:border-[#2E2E2E] text-[#2E2E2E] rounded-md">SignIn</Link>
            <Link href={'/register'} className="bg-[#2E2E2E] border-[#2E2E2E] flex-1 py-1 px-3 border rounded-md text-[#F8F4EE]">SignUp</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
