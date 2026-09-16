import { createClient } from "../../../utils/supabase/server";
import { redirect } from "next/navigation";
import SampleBooks from "./SampleBooks";

export default async function AudiobooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-black mb-3">샘플 오디오북</h1>
          <p className="text-gray-500 text-sm sm:text-base">저작권 걱정 없는 다양한 언어의 명작들을 바로 내 서재에 추가하고 읽어보세요.</p>
        </header>

        <SampleBooks userId={user.id} />
      </div>
    </div>
  );
}
