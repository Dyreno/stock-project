import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-[#5865F2] px-6 py-3 font-medium text-white hover:bg-[#4752C4] cursor-pointer"
        >
          Login with Discord
        </button>
      </form>
    </main>
  );
}