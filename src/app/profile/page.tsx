"use client"
import Header from "@/components/Header";
import ProfileCard from "@/components/ProfileCard";
import ProfileForm from "@/components/ProfileForm";
import { getProfile } from "@/lib/profile";
import { useState, useEffect } from "react";
function ProfilePage () {
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const result = await getProfile();
      if (result.data) {
        setUsername(result.data.username);
      }
    }
    loadProfile();
  }, []);

  return (
  <div className="bg-[#F8F4EE] h-dvh flex">
    <main className="bg-[#F8F4EE] max-w-10/12 mx-auto w-full flex flex-col py-16">
      <Header />
      <div className="flex-1 flex flex-col sm:flex-row gap-6 pt-4">
        <ProfileCard />
        <ProfileForm initialUsername={username}/>
      </div>
    </main>
  </div>
  );
}

export default ProfilePage;