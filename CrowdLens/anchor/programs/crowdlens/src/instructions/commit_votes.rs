use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::{Config, TaskEscrow}};

#[derive(Accounts)]
pub struct CommitVotes<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ CrowdLensError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump,
        constraint = !task.settled @ CrowdLensError::AlreadySettled
    )]
    pub task: Account<'info, TaskEscrow>,
}

pub fn handle_commit_votes(ctx: Context<CommitVotes>, vote_commitment: [u8; 32]) -> Result<()> {
    require!(vote_commitment != [0u8; 32], CrowdLensError::EmptyCommitment);
    require!(
        ctx.accounts.task.vote_commitment == [0u8; 32],
        CrowdLensError::VotesAlreadyCommitted
    );
    ctx.accounts.task.vote_commitment = vote_commitment;
    Ok(())
}
