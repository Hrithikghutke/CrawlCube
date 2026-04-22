import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import bgLogo from "@/assets/login-assets/bg-logo-login.svg";
import promptBox from "@/assets/login-assets/prompt-box-image.png";
import circleBlob from "@/assets/login-assets/circle-blob.svg";
import semiCircleBlob from "@/assets/login-assets/semicircle-blob.svg";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-black flex overflow-hidden relative">
      {/* Left Column - Visuals */}
      <div className="hidden lg:flex flex-1 relative bg-[#0a0a0a] items-end justify-center overflow-hidden">
        {/* Background Isometric Logo - Large, filling center-bottom of left panel */}
        <div className="absolute inset-0 z-0 flex items-end justify-start pointer-events-none">
          <Image
            src={bgLogo}
            alt="Crawl Cube Background Pattern"
            width={700}
            height={700}
            className="object-contain opacity-100 "
            priority
          />
        </div>

        {/* Bottom Prompt Box */}
        <div className="relative z-20 w-full px-8 pb-20 flex justify-center">
          <Image
            src={promptBox}
            alt="Prompt Example"
            className="w-full max-w-lg object-contain"
          />
        </div>
      </div>

      {/* Right Column - Sign Up Widget */}
      <div className="flex-1 flex items-center justify-center p-4 z-30 bg-black relative overflow-hidden">
        {/* Semicircle Blob - Bottom left */}
        <div className="absolute bottom-[-1%] left-[-15%] md:left-[-10%] lg:left-[-10%]  z-0 w-56 h-56 pointer-events-none ">
          <Image
            src={semiCircleBlob}
            alt=""
            className="w-full h-full object-contain"
            priority
          />
        </div>
        {/* Large Circle Blob - Top right of right column, behind sign-up card */}

        <div className="absolute -top-20 -right-24 w-[400px] h-[400px] pointer-events-none  z-0">
          <Image
            src={circleBlob}
            alt=""
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Loading skeleton - shown while Clerk JS loads */}
        <div className="w-full max-w-[420px] relative z-10 has-[.cl-rootBox]:hidden">
          <div className="flex flex-col items-center gap-5 p-8 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-40 rounded bg-white/10" />
              <div className="h-4 w-56 rounded bg-white/5" />
            </div>
            <div className="w-full h-10 rounded-lg bg-white/10 mt-2" />
            <div className="flex gap-3 w-full">
              <div className="flex-1 h-10 rounded-lg bg-white/10" />
              <div className="flex-1 h-10 rounded-lg bg-white/10" />
            </div>
            <div className="flex items-center w-full gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <div className="h-4 w-6 rounded bg-white/5" />
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="w-full flex flex-col gap-2">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="w-full h-10 rounded-lg bg-white/10" />
            </div>
            <div className="w-full h-10 rounded-lg bg-white/15" />
          </div>
        </div>

        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "transparent",
            },
            elements: {
              rootBox: "w-full max-w-[420px] relative z-10",
              cardBox: { border: "none", boxShadow: "none", outline: "none" },
              card: {
                border: "none",
                boxShadow: "none",
                outline: "none",
                backgroundColor: "transparent",
              },
              headerTitle:
                "text-2xl font-bold font-sans text-white text-center",
              headerSubtitle: "text-gray-400 mt-2 text-center",
              formButtonPrimary:
                "bg-white text-black hover:bg-gray-200 transition-colors font-semibold shadow-md",
              socialButtonsBlockButton:
                "border border-white/10 hover:bg-white/5 transition-all text-gray-300",
              socialButtonsBlockButtonText: "font-semibold",
              footerActionLink: "text-white hover:text-gray-300 font-medium",
              formFieldInput:
                "bg-[#111] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-600 rounded-lg",
              formFieldLabel: "text-gray-400 font-medium mb-1.5",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-500",
              identityPreviewText: "text-gray-300",
              identityPreviewEditButtonIcon: "text-gray-400",
              formFieldAction: "text-gray-400 hover:text-white",
            },
          }}
        />
      </div>
    </main>
  );
}
