import Head from "next/head";
import PresalePage from "../components/presale/PresalePage";
import Layout from "../components/Layout";

export default function PresaleIndex() {
  return (
    <>
      <Head>
        <title>TESOLA Token Presale - Early Access for Supporters</title>
        <meta
          name="description"
          content="Join the exclusive TESOLA token presale. Limited time offer for early supporters with special discounted price."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4B0082" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content="TESOLA Token Presale - Early Access for Supporters" />
        <meta property="og:description" content="Join the exclusive TESOLA token presale. Limited time offer for early supporters with special discounted price." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://tesola.xyz/presale" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TESOLA Token Presale - Early Access for Supporters" />
        <meta name="twitter:description" content="Join the exclusive TESOLA token presale. Limited time offer for early supporters with special discounted price." />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Head>
      <Layout>
        <PresalePage initialSupply={0} />
      </Layout>
    </>
  );
}