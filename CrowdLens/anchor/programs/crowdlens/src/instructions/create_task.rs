use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::{constants::*, error::CrowdLensError, state::{Config, CreatorStats, TaskEscrow}};

#[derive(Accounts)]
#[instruction(amount: u64, required: u32, nonce: u64)]
pub struct CreateTask<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorStats::INIT_SPACE,
        seeds = [CREATOR_SEED, creator.key().as_ref()],
        bump
    )]
    pub creator_stats: Account<'info, CreatorStats>,
    #[account(
        init,
        payer = creator,
        space = 8 + TaskEscrow::INIT_SPACE,
        seeds = [TASK_SEED, creator.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub task: Account<'info, TaskEscrow>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_task(
    ctx: Context<CreateTask>,
    amount: u64,
    required: u32,
    nonce: u64,
) -> Result<()> {
    require!(required > 0, CrowdLensError::BadRequired);
    let expected = (required as u64)
        .checked_mul(LAMPORTS_PER_VOTE)
        .ok_or(CrowdLensError::Overflow)?;
    require!(amount == expected, CrowdLensError::BadAmount);
    require!(nonce == ctx.accounts.creator_stats.task_count, CrowdLensError::BadNonce);

    if ctx.accounts.creator_stats.creator == Pubkey::default() {
        ctx.accounts.creator_stats.creator = ctx.accounts.creator.key();
    }
    require_keys_eq!(
        ctx.accounts.creator_stats.creator,
        ctx.accounts.creator.key(),
        CrowdLensError::Unauthorized
    );

    transfer(
        CpiContext::new(
            anchor_lang::system_program::ID,
            Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.task.to_account_info(),
            },
        ),
        amount,
    )?;

    let task = &mut ctx.accounts.task;
    task.creator = ctx.accounts.creator.key();
    task.nonce = nonce;
    task.amount = amount;
    task.required = required;
    task.remaining_lamports = amount;
    task.vote_commitment = [0u8; 32];
    task.chunks_paid = 0;
    task.settled = false;

    ctx.accounts.creator_stats.task_count = nonce
        .checked_add(1)
        .ok_or(CrowdLensError::Overflow)?;

    Ok(())
}
