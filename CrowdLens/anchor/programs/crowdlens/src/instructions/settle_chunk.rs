use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::{Config, TaskEscrow}};

#[derive(Accounts)]
pub struct SettleChunk<'info> {
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

pub fn handle_settle_chunk(ctx: Context<SettleChunk>, amounts: Vec<u64>) -> Result<()> {
    require!(
        ctx.accounts.task.vote_commitment != [0u8; 32],
        CrowdLensError::VotesNotCommitted
    );
    require!(
        amounts.len() > 0 && amounts.len() <= MAX_SETTLE_CHUNK,
        CrowdLensError::InvalidChunkSize
    );
    require!(
        amounts.len() == ctx.remaining_accounts.len(),
        CrowdLensError::AmountAccountMismatch
    );

    let mut total: u64 = 0;
    for amount in amounts.iter() {
        require!(*amount > 0, CrowdLensError::ZeroPayout);
        total = total.checked_add(*amount).ok_or(CrowdLensError::Overflow)?;
    }
    require!(
        total <= ctx.accounts.task.remaining_lamports,
        CrowdLensError::Overpay
    );

    let task_key = ctx.accounts.task.key();
    let task_info = ctx.accounts.task.to_account_info();

    for (i, amount) in amounts.iter().enumerate() {
        let worker = &ctx.remaining_accounts[i];
        require!(worker.is_writable, CrowdLensError::WorkerNotWritable);
        require_keys_neq!(worker.key(), task_key, CrowdLensError::InvalidWorker);
        require_keys_neq!(
            worker.key(),
            ctx.accounts.authority.key(),
            CrowdLensError::InvalidWorker
        );
        for prior in ctx.remaining_accounts.iter().take(i) {
            require_keys_neq!(worker.key(), prior.key(), CrowdLensError::DuplicateWorker);
        }

        task_info.sub_lamports(*amount)?;
        worker.add_lamports(*amount)?;
    }

    let task = &mut ctx.accounts.task;
    task.remaining_lamports = task
        .remaining_lamports
        .checked_sub(total)
        .ok_or(CrowdLensError::Overflow)?;
    task.chunks_paid = task.chunks_paid.saturating_add(1);
    Ok(())
}
