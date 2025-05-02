use anchor_lang::prelude::*;

declare_id\!("CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu");

#[program]
pub mod nft_staking {
    use super::*;
    
    pub fn stake_nft(ctx: Context<StakeNft>, staking_period: u64) -> Result<()> {
        Ok(())
    }
    
    pub fn unstake_nft(ctx: Context<UnstakeNft>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StakeNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    pub escrow_authority: AccountInfo<'info>,
    #[account(mut)]
    pub stake_info: Account<'info, StakeInfo>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct UnstakeNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    pub escrow_authority: AccountInfo<'info>,
    #[account(mut)]
    pub stake_info: Account<'info, StakeInfo>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct StakeInfo {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub staked_at: i64,
    pub release_date: i64,
    pub is_staked: bool,
}

#[event]
pub struct StakeEvent {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub staked_at: i64,
    pub release_date: i64,
}

#[event]
pub struct UnstakeEvent {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub unstaked_at: i64,
    pub was_early: bool,
}
