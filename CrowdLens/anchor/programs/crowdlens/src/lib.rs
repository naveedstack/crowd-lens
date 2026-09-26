pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4");

#[program]
pub mod crowdlens {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handle_initialize(ctx)
    }

    pub fn create_task(
        ctx: Context<CreateTask>,
        amount: u64,
        required: u32,
        nonce: u64,
    ) -> Result<()> {
        crate::instructions::create_task::handle_create_task(ctx, amount, required, nonce)
    }

    pub fn commit_votes(
        ctx: Context<CommitVotes>,
        vote_commitment: [u8; 32],
        winner_option_id: u32,
    ) -> Result<()> {
        crate::instructions::commit_votes::handle_commit_votes(
            ctx,
            vote_commitment,
            winner_option_id,
        )
    }

    pub fn settle_chunk(ctx: Context<SettleChunk>, amounts: Vec<u64>) -> Result<()> {
        crate::instructions::settle_chunk::handle_settle_chunk(ctx, amounts)
    }

    pub fn close_task(ctx: Context<CloseTask>) -> Result<()> {
        crate::instructions::close_task::handle_close_task(ctx)
    }
}
