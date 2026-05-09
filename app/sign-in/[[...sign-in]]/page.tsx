import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import bgLogo from "@/assets/login-assets/bg-logo-login.svg";
import planet from "@/assets/login-assets/planet.svg";
import promptBox from "@/assets/login-assets/prompt-box-image.png";
import circleBlob from "@/assets/login-assets/circle-blob.svg";
import semiCircleBlob from "@/assets/login-assets/semicircle-blob.svg";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-black flex overflow-hidden relative">
      {/* Left Column - Visuals */}
      <div className="hidden  lg:flex flex-1 relative bg-linear-to-bl from-neutral-800 to-black  items-end justify-center overflow-hidden">
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

        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center pb-7">
            <h2 className="text-3xl opacity-90 font-bold text-white">
              Turn your ideas into Reality.
            </h2>
            <p className="opacity-50 text-xs mt-2 text-center">
              Start for free and get attractive offers from the community
            </p>
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
      </div>

      {/* Right Column - Sign In Widget */}
      <div className="flex-1 flex items-center justify-center p-4 z-30 bg-black relative overflow-hidden">
        {/* Semicircle Blob - Right edge of left panel */}
        <div className="absolute bottom-[-1%] left-[-15%] md:left-[-10%] lg:left-[-10%] z-0 w-56 h-56 pointer-events-none ">
          <Image
            src={semiCircleBlob}
            alt=""
            className="w-full h-full object-contain"
            priority
          />
        </div>
        {/* Large Circle Blob - Top right of right column, behind sign-in card */}

        <div className="absolute -top-20 -right-24 w-[400px] h-[400px] pointer-events-none  z-0">
          <Image
            src={circleBlob}
            alt=""
            className="w-full h-full object-contain"
            priority
          />
        </div>

        <SignIn
          fallbackRedirectUrl="/home"
          forceRedirectUrl="/home"
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
