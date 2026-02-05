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
  <div className="bg-background min-h-dvh flex">
    <main className="bg-background w-full max-w-[92%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-5/6 mx-auto flex flex-col py-6 sm:py-10 md:py-16">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 pt-4">
        <ProfileCard />
        <ProfileForm initialUsername={username}/>
      </div>
    </main>
  </div>
  );
}

export default ProfilePage;
