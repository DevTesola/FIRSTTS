import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase URL or Key not set in environment variables");
  throw new Error("Supabase URL or Key not set in environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const { count, error } = await supabase
      .from("minted_nfts")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw new Error(`Failed to fetch minted count: ${error.message}`);
    }

    res.status(200).json({ count: count || 0 });
  } catch (err) {
    console.error("Get minted count error:", err);
    res.status(500).json({ error: err.message });
  }
}