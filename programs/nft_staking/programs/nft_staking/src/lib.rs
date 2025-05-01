use anchor_lang::prelude::*;

declare_id!("DiQnXQDT1raqfcxHL49vPs65wedQNjh5fnowBCuZCC52");

#[program]
pub mod nft_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
