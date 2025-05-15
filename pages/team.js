import React from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import Image from "next/image";

const TeamMember = ({ name, role, emoji, description, status, skills, glowColor = "rgba(139,92,246,0.5)" }) => (
  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl overflow-hidden group hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all duration-500 border border-gray-700/50 hover:border-purple-500/50 relative animate-fadeIn backdrop-blur-sm transform hover:translate-y-[-5px] hover:rotate-1">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-1000 group-hover:duration-500 animate-gradient-xy"></div>
    
    <div className="p-7 relative z-10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
        <div className="relative flex-shrink-0 w-32 h-32 group-hover:scale-105 transition-transform duration-500">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 animate-pulse-slow blur-md`}></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 blur-xl"></div>
          <div className={`absolute inset-0 rounded-full border-2 border-purple-500/30 group-hover:border-purple-400/50 transition-colors duration-500 shadow-[0_0_20px_${glowColor}] group-hover:shadow-[0_0_30px_${glowColor}]`}></div>
          
          {/* Animated glow effect */}
          <div className="absolute inset-[-2px] rounded-full z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-30 group-hover:opacity-70 transition-opacity duration-500">
              <circle cx="50" cy="50" r="48" fill="none" stroke="url(#team-gradient)" strokeWidth="0.8" strokeDasharray="0.8,1.2" />
              <defs>
                <linearGradient id="team-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="absolute inset-2 rounded-full overflow-hidden backdrop-blur-sm bg-gradient-to-br from-gray-800/90 to-gray-900/90 flex items-center justify-center">
            {typeof emoji === 'string' ? (
              <div className="text-6xl group-hover:scale-110 transition-transform duration-500 transform group-hover:rotate-3">
                {emoji}
              </div>
            ) : (
              emoji
            )}
          </div>
          
          {status && (
            <div className="absolute -bottom-1 -right-1 bg-gray-900 text-xs font-bold px-2 py-1 rounded-full border border-gray-700/70 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform z-20">
              {status}
            </div>
          )}
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-1">{name}</h3>
          <div className="text-sm text-purple-300 mb-3 font-medium relative inline-block">
            {role}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
          
          {skills && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="inline-block text-xs bg-gray-800/90 text-gray-300 px-3 py-1 rounded-full border border-gray-700/70 hover:border-purple-500/50 transition-colors transform hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] shadow-inner hover:text-white cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const RobotTeamMember = ({ name, role, description, version, emoji = "🤖", glowColor = "rgba(59,130,246,0.5)" }) => (
  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl overflow-hidden group hover:shadow-[0_0_35px_rgba(59,130,246,0.4)] transition-all duration-500 border border-gray-700/50 hover:border-blue-500/50 relative animate-fadeIn backdrop-blur-sm transform hover:translate-y-[-5px] hover:rotate-1">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-cyan-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-1000 group-hover:duration-500 animate-gradient-xy"></div>
    
    <div className="p-7 relative z-10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
        <div className="relative flex-shrink-0 w-32 h-32 group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 animate-pulse-slow blur-md"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 blur-xl"></div>
          <div className={`absolute inset-0 rounded-full border-2 border-blue-500/30 group-hover:border-blue-400/50 transition-colors duration-500 shadow-[0_0_20px_${glowColor}] group-hover:shadow-[0_0_30px_${glowColor}]`}></div>
          
          {/* Digital Circuit Pattern Around Circle */}
          <div className="absolute inset-[-2px] rounded-full z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-30 group-hover:opacity-70 transition-opacity duration-500">
              <circle cx="50" cy="50" r="48" fill="none" stroke="url(#circuit-gradient)" strokeWidth="0.8" strokeDasharray="0.8,1.2" />
              <path d="M20,50 H40 M60,50 H80 M50,20 V40 M50,60 V80" stroke="url(#circuit-gradient)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="url(#circuit-gradient)" strokeWidth="0.5" strokeDasharray="1,2" />
              <defs>
                <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="absolute inset-2 rounded-full overflow-hidden backdrop-blur-sm bg-gradient-to-br from-gray-800/90 to-gray-900/90 flex items-center justify-center">
            {typeof emoji === 'string' ? (
              <div className="text-6xl group-hover:animate-pulse transition-transform duration-500">
                {emoji}
              </div>
            ) : (
              emoji
            )}
          </div>
          
          <div className="absolute -bottom-1 -right-1 bg-blue-900 text-xs font-bold px-2 py-1 rounded-full border border-blue-700/70 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform z-20">
            v{version}
          </div>
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">{name}</h3>
          <div className="text-sm text-blue-300 mb-3 font-medium relative inline-block">
            {role}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0"></div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
          
          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="inline-block text-xs bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full border border-blue-700/50 hover:border-blue-500/70 transition-colors transform hover:scale-105 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              AI-POWERED
            </span>
            <span className="inline-block text-xs bg-cyan-900/30 text-cyan-300 px-3 py-1 rounded-full border border-cyan-700/50 hover:border-cyan-500/70 transition-colors transform hover:scale-105 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              24/7 OPERATION
            </span>
            <span className="inline-block text-xs bg-indigo-900/30 text-indigo-300 px-3 py-1 rounded-full border border-indigo-700/50 hover:border-indigo-500/70 transition-colors transform hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              SELF-OPTIMIZING
            </span>
            <span className="inline-block text-xs bg-gray-800/90 text-gray-300 px-3 py-1 rounded-full border border-gray-700/70 animate-pulse hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Team = () => {
  return (
    <Layout>
      <Head>
        <title>TESOLA Team - TESOLA</title>
        <meta name="description" content="Meet the team behind TESOLA - a dedicated group of developers, marketers, artists, and legal experts building the TESOLA ecosystem on Solana." />
      </Head>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full bg-purple-500 blur-[120px] opacity-5 animate-pulse-slow"></div>
            <div className="w-64 h-64 rounded-full bg-blue-500 blur-[100px] opacity-5 animate-pulse-slow absolute top-10 left-[45%]"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 mb-6 z-10 relative [background-size:200%]">
            Meet the TESOLA Team
          </h1>
          <div className="h-1.5 w-40 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50 mx-auto rounded-full mb-8 animate-gradient-xy"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A dedicated group of innovators building the bridge between Solana and Tesla ecosystems
          </p>
        </div>

        {/* Development Team */}
        <div className="mb-16 relative">
          <div className="absolute top-0 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>
          
          <div className="text-center mb-10 relative">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 inline-block [background-size:200%]">
              Development Team
            </h2>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full animate-pulse-slow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamMember 
              name="Dev" 
              role="Lead Developer & Creator"
              emoji={
                <div className="w-16 h-16 relative transform hover:scale-110 transition-transform duration-500 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full animate-pulse-slow"></div>
                  <img 
                    src="/dev-icon.svg" 
                    alt="Dev Icon" 
                    className="w-full h-full z-10 relative group-hover:animate-spin-slow"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-full transition-all duration-1000 z-20"></div>
                </div>
              }
              description="Solana ecosystem architect and Tesla enthusiast since 2016. Architect of the TESOLA ecosystem and Drive-to-Earn concept. Coding TESOLA's future one commit at a time."
              skills={["Solana", "React", "Web3", "Smart Contracts", "TypeScript"]}
              glowColor="rgba(139,92,246,0.5)"
            />
            
            <TeamMember 
              name="TESOLA-1" 
              role="Frontend Developer"
              emoji={
                <div className="w-16 h-16 relative transform hover:scale-110 transition-transform duration-500 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full animate-pulse-slow"></div>
                  <img 
                    src="/frontend-icon.svg" 
                    alt="Frontend Icon" 
                    className="w-full h-full z-10 relative group-hover:animate-spin-slow"
                  />
                </div>
              }
              description="AI-augmented development assistant specializing in creating intuitive interfaces. Responsible for TESOLA's responsive UX and drive-to-earn visualizations."
              skills={["React", "Next.js", "TailwindCSS", "UI/UX", "Animations"]}
              glowColor="rgba(14,165,233,0.5)"
            />
            
            <RobotTeamMember 
              name="RoboDev-42" 
              role="AI Development Assistant"
              emoji={
                <div className="w-16 h-16 relative transform hover:scale-110 transition-transform duration-500 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full animate-pulse-slow"></div>
                  <img 
                    src="/ai-icon.svg" 
                    alt="AI Icon" 
                    className="w-full h-full z-10 relative group-hover:animate-pulse-slow"
                  />
                </div>
              }
              description="Specialized AI assistant trained on Solana ecosystem development. Helps with code optimization, testing, and rapid prototyping to accelerate development cycles."
              version="3.7"
              glowColor="rgba(59,130,246,0.5)"
            />
            
            <TeamMember 
              name="TESOLA-2" 
              role="Backend Developer"
              emoji={
                <div className="w-16 h-16 relative transform hover:scale-110 transition-transform duration-500 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full animate-pulse-slow"></div>
                  <img 
                    src="/backend-icon.svg" 
                    alt="Backend Icon" 
                    className="w-full h-full z-10 relative group-hover:animate-spin-slow"
                  />
                </div>
              }
              description="Blockchain infrastructure specialist focused on token economics implementation and staking mechanics. Building the backbone of TESOLA's rewards system."
              skills={["Anchor", "Rust", "Token Economics", "Smart Contracts"]}
              glowColor="rgba(168,85,247,0.5)"
            />
          </div>
        </div>

        {/* Marketing Team */}
        <div className="mb-16 relative">
          <div className="absolute top-0 -right-20 w-40 h-40 bg-green-500/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-[100px] -z-10"></div>
          
          <div className="text-center mb-10 relative">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 inline-block [background-size:200%]">
              Marketing Team
            </h2>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-green-500 to-cyan-500 mx-auto rounded-full animate-pulse-slow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamMember 
              name="Cryptic Marketer" 
              role="Marketing Lead"
              emoji="🔮"
              description="Leading TESOLA's go-to-market strategy while building partnerships with Tesla communities and Solana projects. Currently operating anonymously."
              status="Under Review"
              skills={["Strategy", "Partnerships", "Community Building"]}
              glowColor="rgba(16,185,129,0.5)"
            />
            
            <TeamMember 
              name="Social Media Wizard" 
              role="Community Manager"
              emoji="✨"
              description="Engaging with TESOLA's growing community across Discord, Twitter, and Telegram. Orchestrating campaigns to spread the word about Drive-to-Earn."
              status="In Talks"
              skills={["Community Management", "Social Media", "Content Creation"]}
              glowColor="rgba(6,182,212,0.5)"
            />
          </div>
        </div>

        {/* Art Team */}
        <div className="mb-16 relative">
          <div className="absolute top-0 -left-20 w-40 h-40 bg-amber-500/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 -right-20 w-40 h-40 bg-red-500/5 rounded-full blur-[100px] -z-10"></div>
          
          <div className="text-center mb-10 relative">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-400 inline-block [background-size:200%]">
              Art Team
            </h2>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-amber-500 to-red-500 mx-auto rounded-full animate-pulse-slow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamMember 
              name="ZLACK" 
              role="NFT Commander"
              emoji="🎨"
              description="The creative genius behind SOLARA NFTs. Blending futuristic designs with Tesla-inspired aesthetics to create unique collectibles for the TESOLA ecosystem."
              skills={["Digital Art", "3D Modeling", "NFT Design", "Animation"]}
              glowColor="rgba(234,88,12,0.5)"
            />
            
            <TeamMember 
              name="Alex Morgan" 
              role="Visual Design Specialist"
              emoji="🖌️"
              description="Creative digital artist bringing TESOLA's visual identity to life. Specializes in futuristic UI/UX design and creates promotional materials that blend crypto aesthetics with Tesla-inspired elements."
              skills={["Digital Art", "UI/UX Design", "Visual Identity", "Motion Graphics"]}
              glowColor="rgba(249,115,22,0.5)"
            />
          </div>
        </div>

        {/* Legal Team */}
        <div className="mb-16 relative">
          <div className="absolute top-0 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 -left-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-[100px] -z-10"></div>
          
          <div className="text-center mb-10 relative">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 inline-block [background-size:200%]">
              Legal Team
            </h2>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full animate-pulse-slow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <TeamMember 
              name="Richard Bennett" 
              role="Blockchain Compliance Advisor"
              emoji="⚖️"
              description="Working behind the scenes to ensure TESOLA's operations comply with evolving regulations in the cryptocurrency space. Specializes in international blockchain law."
              skills={["Crypto Regulations", "Compliance", "Legal Structure", "Tokenomics Advisory"]}
              glowColor="rgba(79,70,229,0.5)"
            />
          </div>
        </div>

        {/* Join Our Team Section */}
        <div className="bg-gradient-to-br from-gray-900/70 to-purple-900/20 rounded-xl overflow-hidden border border-purple-500/30 p-10 shadow-[0_0_30px_rgba(139,92,246,0.2)] relative group hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-500 transform hover:translate-y-[-5px]">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] bg-cover opacity-10 mix-blend-overlay group-hover:opacity-15 transition-opacity"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-purple-500/5 blur-[40px] animate-pulse-slow"></div>
          <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-blue-500/5 blur-[40px] animate-pulse-slow"></div>
          
          <div className="text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-4 [background-size:200%]">
              Join the TESOLA Team
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 mx-auto rounded-full mb-6 animate-gradient-xy"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Are you passionate about Solana, Tesla, and the future of Web3? We're always looking for talented individuals to join our journey.
            </p>
            
            <a 
              href="https://t.me/tesolachat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white font-bold transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transform hover:scale-105 hover:rotate-1 hover:translate-y-[-2px]"
            >
              Contact Us on Telegram
            </a>
            
            <div className="mt-6 text-gray-400 text-sm">
              <p>Join us in building the future of decentralized mobility</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Team;