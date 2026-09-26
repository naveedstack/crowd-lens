use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::Config};
use super::task_account::{load_task, resize_task_if_needed, store_task, verify_task_pda};

#[derive(Accounts)]
pub struct SettleChunk<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ CrowdLensError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    /// CHECK: task PDA is verified from on-chain bytes before payouts.
    #[account(mut)]
    pub task: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_settle_chunk(ctx: Context<SettleChunk>, amounts: Vec<u64>) -> Result<()> {
    verify_task_pda(&ctx.accounts.task)?;
    resize_task_if_needed(&ctx.accounts.task, &ctx.accounts.authority.to_account_info())?;

    let mut task = load_task(&ctx.accounts.task)?;
    require!(!task.settled, CrowdLensError::AlreadySettled);
    require!(
        task.vote_commitment != [0u8; 32],
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
    require!(total <= task.remaining_lamports, CrowdLensError::Overpay);

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

    task.remaining_lamports = task
        .remaining_lamports
        .checked_sub(total)
        .ok_or(CrowdLensError::Overflow)?;
    task.chunks_paid = task.chunks_paid.saturating_add(1);
    store_task(&ctx.accounts.task, &task)
}
