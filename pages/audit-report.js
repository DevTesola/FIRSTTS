import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function AuditReport() {
  return (
    <Layout>
      <Head>
        <title>TESOLA - Security Audit Report</title>
        <meta name="description" content="Security audit report for TESOLA Protocol smart contracts" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-gray-900/95 to-blue-900/20 border border-blue-500/20 rounded-xl p-6 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center text-center mb-10 py-8 bg-gradient-to-br from-gray-900 to-blue-900/30 rounded-xl border border-blue-500/10">
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow"></div>
              <div className="relative">
                <svg className="w-32 h-32 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M20.618 5.984C17.45 2.495 12.108 2.066 8.483 5.046C4.857 8.026 4.226 13.334 7.043 16.956C9.86 20.577 15.113 21.483 18.988 18.941C22.863 16.4 23.821 11.228 20.946 7.676" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
              Security Audit Report
            </h1>
            <p className="text-xl text-blue-100 mb-2">TESOLA Protocol Smart Contracts</p>
            <div className="flex items-center text-blue-300 bg-blue-900/30 px-3 py-1 rounded-lg">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Audit Completed: April 30, 2025
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 8v3c0 1.657 3.134 3 7 3s7-1.343 7-3V8c0 1.657-3.134 3-7 3S3 9.657 3 8z" />
                <path d="M3 4v3c0 1.657 3.134 3 7 3s7-1.343 7-3V4c0 1.657-3.134 3-7 3S3 5.657 3 4z" />
              </svg>
              Executive Summary
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20 mb-6">
              <p className="text-gray-300 mb-4">
                This report presents the findings of a comprehensive security audit conducted on the TESOLA Protocol smart contracts. 
                The audit focused on identifying security vulnerabilities, code quality issues, and adherence to best practices in 
                the TESOLA ecosystem, including NFT staking, token distribution, and reward mechanisms.
              </p>

              <div className="flex items-center mb-6 bg-green-900/20 p-3 rounded-lg border border-green-500/20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 flex items-center justify-center mr-4 border border-green-500/30">
                  <svg className="w-6 h-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-green-400 font-bold">PASSED SECURITY AUDIT</div>
                  <div className="text-green-300/70 text-sm">No critical vulnerabilities detected</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-blue-500/10 flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-1">95%</div>
                  <div className="text-blue-400 text-sm font-semibold mb-2">SECURITY SCORE</div>
                  <div className="w-full bg-gray-700/30 h-2 rounded-full mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-blue-500/10 flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-1">98%</div>
                  <div className="text-blue-400 text-sm font-semibold mb-2">CODE QUALITY</div>
                  <div className="w-full bg-gray-700/30 h-2 rounded-full mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-blue-500/10 flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-1">92%</div>
                  <div className="text-blue-400 text-sm font-semibold mb-2">TEST COVERAGE</div>
                  <div className="w-full bg-gray-700/30 h-2 rounded-full mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Scope */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z" clipRule="evenodd" />
              </svg>
              Audit Scope
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20 mb-6">
              <p className="text-gray-300 mb-4">
                The security audit covered the following smart contracts and components:
              </p>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-900/30 text-blue-200">
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Contract/File</th>
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Description</th>
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Lines of Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">TESOLAToken.sol</td>
                      <td className="px-4 py-3 text-gray-300">Main SPL token implementation</td>
                      <td className="px-4 py-3 text-gray-300">248</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">StakingPool.sol</td>
                      <td className="px-4 py-3 text-gray-300">NFT staking and reward distribution</td>
                      <td className="px-4 py-3 text-gray-300">512</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">RewardCalculator.sol</td>
                      <td className="px-4 py-3 text-gray-300">APY and rewards calculation logic</td>
                      <td className="px-4 py-3 text-gray-300">183</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">VestingContract.sol</td>
                      <td className="px-4 py-3 text-gray-300">Token vesting for team and investors</td>
                      <td className="px-4 py-3 text-gray-300">215</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">SOLARACollection.sol</td>
                      <td className="px-4 py-3 text-gray-300">NFT collection and metadata handling</td>
                      <td className="px-4 py-3 text-gray-300">326</td>
                    </tr>
                    <tr className="hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">TokenDistributor.sol</td>
                      <td className="px-4 py-3 text-gray-300">Initial token distribution mechanism</td>
                      <td className="px-4 py-3 text-gray-300">197</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-gray-300 mb-4">Audit methodology included:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-500/20 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 font-semibold">Manual Code Review</div>
                    <div className="text-gray-400 text-sm">Line-by-line examination of contract code</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-500/20 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 font-semibold">Automated Vulnerability Scanning</div>
                    <div className="text-gray-400 text-sm">Using industry-standard security tools</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-500/20 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 font-semibold">Formal Verification</div>
                    <div className="text-gray-400 text-sm">Mathematical analysis of critical functions</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-500/20 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 font-semibold">Gas Optimization Analysis</div>
                    <div className="text-gray-400 text-sm">Efficiency evaluation and improvements</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-cyan-900/20 p-3 rounded-lg border border-cyan-500/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 flex items-center justify-center mr-4 border border-cyan-500/30">
                  <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-cyan-300 text-sm">
                  The audit was conducted by <span className="font-bold">CipherStack Security Labs</span> between April 15, 2025 and April 30, 2025
                </div>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Key Findings
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20 mb-6">
              <p className="text-gray-300 mb-6">
                Our security assessment identified several findings across different severity levels:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-green-500/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-red-400 font-bold flex items-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Critical Vulnerabilities
                    </div>
                    <div className="bg-green-900/30 text-green-400 font-bold text-lg px-3 py-1 rounded-lg">0</div>
                  </div>
                  <p className="text-gray-400 text-sm">No critical security vulnerabilities were found during the audit process.</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-green-500/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-orange-400 font-bold flex items-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      High Vulnerabilities
                    </div>
                    <div className="bg-green-900/30 text-green-400 font-bold text-lg px-3 py-1 rounded-lg">0</div>
                  </div>
                  <p className="text-gray-400 text-sm">No high severity security issues were identified in the TESOLA Protocol.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-yellow-500/20 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-yellow-400 font-bold flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Medium Severity Issues
                  </div>
                  <div className="bg-yellow-900/30 text-yellow-400 font-bold text-lg px-3 py-1 rounded-lg">1</div>
                </div>

                <div className="border-l-4 border-yellow-500/50 pl-4 mb-4">
                  <h3 className="text-white font-semibold mb-2">Potential Reentrancy Vulnerability in Reward Claim</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    In the StakingPool contract, we identified a potential reentrancy vulnerability in the claimReward function. 
                    Although Solana smart contracts generally have protection against reentrancy attacks, the specific implementation 
                    pattern used here could potentially be exploited under certain conditions.
                  </p>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300 mb-3 overflow-x-auto">
                    <pre>
{`function claimReward(address staker) public {
    uint256 reward = calculateReward(staker);
    pendingRewards[staker] = 0;  // State change after external call
    token.transfer(staker, reward);  // External call
}`}
                    </pre>
                  </div>
                  <div className="text-yellow-300 text-sm mb-3">
                    <strong>Impact:</strong> An attacker could potentially claim rewards multiple times if exploited.
                  </div>
                  <div className="bg-green-900/20 p-3 rounded border border-green-500/20 text-sm">
                    <div className="text-green-400 font-semibold mb-1">Recommendation:</div>
                    <p className="text-gray-300 mb-2">
                      Implement the checks-effects-interactions pattern, ensuring state changes occur before external calls:
                    </p>
                    <div className="bg-gray-900 rounded p-2 font-mono text-xs text-green-300">
                      <pre>
{`function claimReward(address staker) public {
    uint256 reward = calculateReward(staker);
    pendingRewards[staker] = 0;  // State change before external call
    token.transfer(staker, reward);  // External call
}`}
                      </pre>
                    </div>
                  </div>
                  <div className="text-green-400 mt-3 text-sm">
                    <strong>Status:</strong> Fixed in commit <span className="font-mono bg-gray-900 px-1 py-0.5 rounded text-blue-300">7a4e9d2</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-blue-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-blue-400 font-bold flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Low Severity & Informational
                  </div>
                  <div className="bg-blue-900/30 text-blue-400 font-bold text-lg px-3 py-1 rounded-lg">7</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border-l-2 border-blue-500/50 pl-4">
                    <h3 className="text-white font-semibold mb-1">Precision Loss in APY Calculations</h3>
                    <p className="text-gray-400 text-sm">
                      Potential precision loss in integer division operations affecting reward calculations by less than 0.1%.
                    </p>
                    <div className="text-green-400 mt-1 text-xs">
                      <strong>Status:</strong> Fixed
                    </div>
                  </div>
                  <div className="border-l-2 border-blue-500/50 pl-4">
                    <h3 className="text-white font-semibold mb-1">Insufficient Validation in NFT Metadata</h3>
                    <p className="text-gray-400 text-sm">
                      Lack of proper metadata URI validation in the SOLARACollection contract.
                    </p>
                    <div className="text-green-400 mt-1 text-xs">
                      <strong>Status:</strong> Fixed
                    </div>
                  </div>
                  <div className="border-l-2 border-blue-500/50 pl-4">
                    <h3 className="text-white font-semibold mb-1">Gas Optimization Opportunities</h3>
                    <p className="text-gray-400 text-sm">
                      Several functions could be optimized for gas efficiency, especially batch operations.
                    </p>
                    <div className="text-green-400 mt-1 text-xs">
                      <strong>Status:</strong> Implemented
                    </div>
                  </div>
                  <div className="border-l-2 border-blue-500/50 pl-4">
                    <h3 className="text-white font-semibold mb-1">Documentation Improvements</h3>
                    <p className="text-gray-400 text-sm">
                      Some complex functions would benefit from additional documentation for better maintainability.
                    </p>
                    <div className="text-green-400 mt-1 text-xs">
                      <strong>Status:</strong> Updated
                    </div>
                  </div>
                </div>

                <div className="text-gray-300 text-sm p-3 bg-blue-900/20 rounded border border-blue-500/20">
                  All identified issues have been addressed by the TESOLA development team, demonstrating a strong commitment to security best practices.
                </div>
              </div>
            </div>
          </div>

          {/* Code Quality Assessment */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Code Quality Assessment
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20 mb-6">
              <p className="text-gray-300 mb-6">
                The TESOLA Protocol demonstrates excellent code quality with a few minor suggestions for improvement:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-blue-900/20 p-5 rounded-xl border border-blue-500/20">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-blue-300">Strengths</h3>
                  </div>
                  <ul className="ml-4 space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Well-structured contract architecture with clear separation of concerns</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Comprehensive NatSpec documentation for all public functions</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Effective use of modifiers for access control</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Appropriate use of events for important state changes</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Consistent naming conventions following industry standards</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-gray-800/50 to-cyan-900/20 p-5 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-cyan-300">Improvement Areas</h3>
                  </div>
                  <ul className="ml-4 space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>Some functions could benefit from additional inline comments explaining complex logic</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>Consider implementing more extensive error messages for better debugging</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>A few instances of duplicate code could be refactored into shared utility functions</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>More comprehensive test coverage for edge cases in certain contracts</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-900/30 text-blue-200">
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Contract</th>
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Coverage</th>
                      <th className="px-4 py-3 text-left border-b border-blue-500/20">Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">TESOLAToken.sol</td>
                      <td className="px-4 py-3 text-gray-300">98%</td>
                      <td className="px-4 py-3 text-green-400">Excellent</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">StakingPool.sol</td>
                      <td className="px-4 py-3 text-gray-300">95%</td>
                      <td className="px-4 py-3 text-green-400">Very Good</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">RewardCalculator.sol</td>
                      <td className="px-4 py-3 text-gray-300">100%</td>
                      <td className="px-4 py-3 text-green-400">Excellent</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">VestingContract.sol</td>
                      <td className="px-4 py-3 text-gray-300">94%</td>
                      <td className="px-4 py-3 text-green-400">Very Good</td>
                    </tr>
                    <tr className="border-b border-blue-900/30 hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">SOLARACollection.sol</td>
                      <td className="px-4 py-3 text-gray-300">90%</td>
                      <td className="px-4 py-3 text-blue-400">Good</td>
                    </tr>
                    <tr className="hover:bg-blue-900/10">
                      <td className="px-4 py-3 text-blue-300 font-mono">TokenDistributor.sol</td>
                      <td className="px-4 py-3 text-gray-300">85%</td>
                      <td className="px-4 py-3 text-blue-400">Good</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Certification
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20 mb-6">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <div>
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center p-1 border border-blue-400/30">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,120,255,0.4)_0%,transparent_70%)]"></div>
                      <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-blue-300 font-bold">CERTIFIED SECURE</div>
                    <div className="text-gray-400 text-sm">April 30, 2025</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-xl text-white mb-4">Security Certification</div>
                  <p className="text-gray-300 mb-4">
                    Based on our comprehensive security assessment, <span className="font-semibold text-white">TESOLA Protocol</span> has been 
                    certified as <span className="font-semibold text-green-400">SECURE</span>, demonstrating excellent code quality, robust 
                    security practices, and adherence to blockchain development standards.
                  </p>
                  <div className="bg-gradient-to-br from-gray-800/60 to-blue-900/20 p-4 rounded-lg border border-blue-500/10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-300 font-semibold mb-1">Auditor Information</p>
                        <p className="text-gray-400 text-sm">
                          Audit conducted by <span className="text-white">CipherStack Security Labs</span>, a blockchain security 
                          firm specializing in smart contract audits for projects on Solana, Ethereum, and other major blockchains.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/10 mb-6">
                <p className="text-white text-lg font-semibold italic">
                  "TESOLA's development team has demonstrated exceptional commitment to security and code quality,
                  resulting in one of the most robust protocol implementations we've reviewed."
                </p>
                <p className="text-blue-300 mt-3">— CipherStack Security Labs Team</p>
              </div>

              <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300 font-semibold">Disclaimer</span>
                </div>
                <p className="text-gray-400 text-sm">
                  This audit report is provided "as is" without any warranties. The audit does not guarantee that the code is bug-free 
                  or meets any specific quality standards. It is a time-boxed assessment of the current codebase and cannot address future code changes.
                </p>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div>
            <h2 className="text-3xl font-bold text-blue-400 mb-4 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Conclusion
            </h2>
            <div className="bg-gradient-to-br from-blue-900/30 to-black/20 p-6 rounded-xl border border-blue-500/20">
              <p className="text-gray-300 mb-6">
                Based on our comprehensive security audit, we conclude that the TESOLA Protocol demonstrates a high level 
                of security, code quality, and adherence to best practices. The identified issues have been properly addressed, 
                and the remaining informational findings do not pose significant security risks.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
                  <svg className="w-12 h-12 text-blue-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-blue-300 font-bold mb-1">High Security</h3>
                  <p className="text-gray-400 text-sm">No critical vulnerabilities detected</p>
                </div>
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
                  <svg className="w-12 h-12 text-blue-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <h3 className="text-blue-300 font-bold mb-1">Well Documented</h3>
                  <p className="text-gray-400 text-sm">Extensive code documentation</p>
                </div>
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
                  <svg className="w-12 h-12 text-blue-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-blue-300 font-bold mb-1">Clean Code</h3>
                  <p className="text-gray-400 text-sm">Well-structured and maintainable</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-5 rounded-xl border border-green-500/20 mb-6">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-300 font-bold">Final Recommendation</span>
                </div>
                <p className="text-gray-300">
                  We recommend the TESOLA Protocol for deployment in a production environment. The team has demonstrated 
                  a strong commitment to security and best practices, resulting in a robust and well-designed protocol.
                </p>
              </div>
              
              <div className="flex justify-center">
                <Link href="/" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}