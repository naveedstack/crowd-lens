use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::{Config, TaskEscrow}};

#[derive(Accounts)]
pub struct CloseTask<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ CrowdLensError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        close = creator,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump,
        constraint = !task.settled @ CrowdLensError::AlreadySettled,
        constraint = task.remaining_lamports == 0 @ CrowdLensError::EscrowNotEmpty,
        constraint = task.vote_commitment != [0u8; 32] @ CrowdLensError::VotesNotCommitted
    )]
    pub task: Account<'info, TaskEscrow>,
    /// CHECK: rent returned to the original creator
    #[account(mut, address = task.creator)]
    pub creator: SystemAccount<'info>,
}

pub fn handle_close_task(ctx: Context<CloseTask>) -> Result<()> {
    ctx.accounts.task.settled = true;
    Ok(())
}
