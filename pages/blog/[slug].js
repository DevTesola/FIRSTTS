import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import { blogPosts } from '../../lib/blog-posts';
import { BlogHeroMedia, BlogContentImage } from '../../components/BlogMedia';

// Dynamically import ReactMarkdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading content...</div>
});

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      if (!router.isReady) return;
      
      if (slug && blogPosts[slug]) {
        setPost(blogPosts[slug]);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [slug, router.isReady]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-white">Loading...</div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Error Loading Post</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <Link href="/community" className="text-purple-500 hover:text-purple-400">
              Back to Community
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
            <Link href="/community" className="text-purple-500 hover:text-purple-400">
              Back to Community
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  try {
    return (
      <Layout>
        <Head>
          <title>{post.title} - TESOLA Blog</title>
          <meta name="description" content={post.summary} />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.summary} />
          <meta property="og:image" content={post.heroImage} />
          <meta property="og:url" content={`https://tesola.xyz/blog/${post.id}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:description" content={post.summary} />
          <meta name="twitter:image" content={post.heroImage} />
        </Head>
      
        {/* Content */}
        <div className="py-8 md:py-12">
          {/* Back button */}
          <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
            <Link href="/community?tab=news" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 sm:mb-8 transition-all">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to News
            </Link>
          </div>
          
          <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
          {/* Article Header */}
          <header className="mb-8 sm:mb-10 md:mb-12">
            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-purple-300 mb-3 sm:mb-4">
              <time>{post.date}</time>
              <span className="text-purple-400">•</span>
              <span>{post.readTime} min read</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 mb-4 sm:mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8">
              {post.summary}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <img 
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
                />
                <div className="ml-3 sm:ml-4">
                  <p className="font-medium text-white text-sm sm:text-base">{post.author.name}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{post.author.role}</p>
                </div>
              </div>
              
              {/* Social Share Buttons */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    const url = window.location.href.replace('localhost:3000', 'tesola.xyz');
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg touch-manipulation"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
              </div>
            </div>
          </header>
          
          {/* Hero Image */}
          {post.heroImage && (
            <div className="mb-8 sm:mb-10 md:mb-12">
              <BlogHeroMedia
                src={post.heroImage}
                alt={post.title}
                className="rounded-lg sm:rounded-xl"
              />
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose prose-sm sm:prose-base md:prose-lg prose-invert max-w-none">
            {(() => {
              try {
                return (
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => (
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-6 sm:mt-8 mb-3 sm:mb-4" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-6 sm:mt-8 mb-3 sm:mb-4" {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-300 mt-4 sm:mt-6 mb-2 sm:mb-3" {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="text-gray-300 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base" {...props} />
                      ),
                      a: ({node, ...props}) => {
                        // Check if this is a button-styled link
                        if (props.className && props.className.includes('inline-flex')) {
                          return (
                            <div className="my-6">
                              <a {...props} />
                            </div>
                          );
                        }
                        return (
                          <a className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-300 transition-all touch-manipulation" {...props} />
                        );
                      },
                      img: ({node, ...props}) => (
                        <BlogContentImage {...props} />
                      ),
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-purple-500 pl-4 sm:pl-6 my-4 sm:my-6 text-gray-300 italic" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="list-disc pl-6 sm:pl-8 mb-3 sm:mb-4 text-gray-300" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol className="list-decimal pl-6 sm:pl-8 mb-3 sm:mb-4 text-gray-300" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="mb-1.5 sm:mb-2" {...props} />
                      ),
                      strong: ({node, ...props}) => (
                        <strong className="text-white font-bold" {...props} />
                      ),
                      em: ({node, ...props}) => (
                        <em className="text-gray-200" {...props} />
                      ),
                      code: ({node, ...props}) => (
                        <code className="bg-gray-900/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-purple-300 text-xs sm:text-sm" {...props} />
                      ),
                      pre: ({node, ...props}) => (
                        <pre className="bg-gray-900/50 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm" {...props} />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                );
              } catch (markdownError) {
                return (
                  <div className="text-gray-300">
                    <p className="text-red-400 mb-4">Error rendering content.</p>
                    <pre className="whitespace-pre-wrap">{post.content}</pre>
                  </div>
                );
              }
            })()}
          </div>
          
          {/* Article Footer */}
          <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-purple-500/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900/50 text-purple-300 rounded-full text-xs sm:text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <a 
                href="https://t.me/tesolachat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
              >
                <span>Join Discussion</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.372-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm3.224 17.871c.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-6.895c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-3.592c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953zm-.649-5.443c.654-1.561 2.067-3.182 3.425-3.182s2.771 1.621 3.425 3.182c.146.35.681.336.682-.071 0-2.235-1.836-4.046-4.107-4.046s-4.107 1.811-4.107 4.046c0 .407.536.421.682.071z"/>
                </svg>
              </a>
            </div>
            
            {/* Author Bio */}
            <div className="bg-gray-900/20 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              <img 
                src={post.author.avatar}
                alt={post.author.name}
                width={64}
                height={64}
                className="rounded-full w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
              />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">{post.author.name}</h3>
                <p className="text-sm text-gray-400 mb-2 sm:mb-3">{post.author.role}</p>
                <p className="text-sm text-gray-300">
                  {post.author.name === 'TESOLA Team' 
                    ? 'The official TESOLA development team, dedicated to building the future of meme coins on Solana.'
                    : 'Core developer and blockchain enthusiast with a passion for innovative DeFi solutions.'
                  }
                </p>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="mt-8 sm:mt-12 bg-gray-900/20 rounded-xl p-4 sm:p-6 md:p-8 text-center">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3 sm:mb-4">
                Stay Updated with TESOLA News
              </h3>
              <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6">
                Get the latest updates and exclusive content delivered to your inbox.
              </p>
              <a 
                href="https://t.me/tesolachat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-900/30 text-sm sm:text-base touch-manipulation"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.372-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm3.224 17.871c.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-6.895c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-3.592c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953zm-.649-5.443c.654-1.561 2.067-3.182 3.425-3.182s2.771 1.621 3.425 3.182c.146.35.681.336.682-.071 0-2.235-1.836-4.046-4.107-4.046s-4.107 1.811-4.107 4.046c0 .407.536.421.682.071z"/>
                </svg>
                Join our Telegram
              </a>
            </div>
          </footer>
        </article>
        </div>
      </Layout>
    );
  } catch (renderError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Render Error</h1>
            <p className="text-gray-400 mb-4">{renderError.message}</p>
            <Link href="/community" className="text-purple-500 hover:text-purple-400">
              Back to Community
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
}