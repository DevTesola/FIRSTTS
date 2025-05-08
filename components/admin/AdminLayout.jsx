import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { isAdminWallet } from '../../utils/adminAuth';

// Dynamically load wallet button
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function AdminLayout({ children, title = 'Admin Panel' }) {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  
  // Check admin privileges
  const isAdmin = connected && publicKey && isAdminWallet(publicKey.toString());
  
  useEffect(() => {
    // Redirect if not admin
    if (connected && publicKey && !isAdmin) {
      alert('You do not have permission to access this page.');
      router.push('/');
    }
  }, [connected, publicKey, isAdmin, router]);
  
  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <div className="text-center py-12">
          <p className="text-xl mb-4">Please connect your admin wallet</p>
          <div className="mt-4 flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }
  
  if (connected && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="text-xl text-center text-red-500">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  const adminLinks = [
    { href: '/admin/rewards', label: 'Reward Claims' },
    { href: '/admin/audit-logs', label: 'Audit Logs' },
    { href: '/admin/initialize-pool', label: 'Staking Pool' },
    { href: '/admin/sync-staking', label: 'Sync Staking Data' },
  ];
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <WalletMultiButton />
      </div>
      
      <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex flex-wrap">
          {adminLinks.map((link) => {
            const isActive = router.pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`px-4 py-3 block ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-300'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-sm">
          <span className="text-gray-400">Connected wallet:</span>
          <span className="ml-2 font-mono">{publicKey.toString()}</span>
        </div>
      </div>
      
      {children}
    </div>
  );
}