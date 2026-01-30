import Link from "next/link";
import { LogOut } from 'lucide-react'
import Header from "@/components/Header";

function HomePage () {
   const today = new Date();
   const formattedDate = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
   }).format(today);

   return (
    <div className="bg-[#F8F4EE] h-dvh flex">
      <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
        <Header />
        <p className="text-gray-700 mb-4 mt-5">{formattedDate}</p>
        <div className="flex-1 flex">

        </div>
      </main>
    </div>
  );
}

export default HomePage;