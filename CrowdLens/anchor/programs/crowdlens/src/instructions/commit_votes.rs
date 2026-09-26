use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::Config};
use super::task_account::{load_task, resize_task_if_needed, store_task, verify_task_pda};

#[derive(Accounts)]
pub struct CommitVotes<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ CrowdLensError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    /// CHECK: task PDA is verified from creator/nonce bytes, then resized and deserialized.
    #[account(mut)]
    pub task: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_commit_votes(
    ctx: Context<CommitVotes>,
    vote_commitment: [u8; 32],
    winner_option_id: u32,
) -> Result<()> {
    require!(vote_commitment != [0u8; 32], CrowdLensError::EmptyCommitment);
    verify_task_pda(&ctx.accounts.task)?;
    resize_task_if_needed(&ctx.accounts.task, &ctx.accounts.authority.to_account_info())?;

    let mut task = load_task(&ctx.accounts.task)?;
    require!(!task.settled, CrowdLensError::AlreadySettled);
    require!(
        task.vote_commitment == [0u8; 32],
        CrowdLensError::VotesAlreadyCommitted
    );
    task.vote_commitment = vote_commitment;
    task.winner_option_id = winner_option_id;
    store_task(&ctx.accounts.task, &task)
}
