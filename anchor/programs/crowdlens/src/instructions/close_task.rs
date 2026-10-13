use anchor_lang::prelude::*;

use crate::{constants::*, error::CrowdLensError, state::Config};
use super::task_account::{load_task, resize_task_if_needed, store_task, verify_task_pda};

#[derive(Accounts)]
pub struct CloseTask<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority @ CrowdLensError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    /// CHECK: task PDA is verified from on-chain bytes before close.
    #[account(mut)]
    pub task: UncheckedAccount<'info>,
    /// CHECK: rent returned to the original creator after PDA check
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_close_task(ctx: Context<CloseTask>) -> Result<()> {
    let (creator, _) = verify_task_pda(&ctx.accounts.task)?;
    require_keys_eq!(ctx.accounts.creator.key(), creator, CrowdLensError::InvalidTask);
    resize_task_if_needed(&ctx.accounts.task, &ctx.accounts.authority.to_account_info())?;

    let mut task = load_task(&ctx.accounts.task)?;
    require!(!task.settled, CrowdLensError::AlreadySettled);
    require!(
        task.vote_commitment != [0u8; 32],
        CrowdLensError::VotesNotCommitted
    );

    let remaining = task.remaining_lamports;
    if remaining > 0 {
        ctx.accounts.task.sub_lamports(remaining)?;
        ctx.accounts.authority.add_lamports(remaining)?;
        task.remaining_lamports = 0;
    }
    task.settled = true;
    store_task(&ctx.accounts.task, &task)?;

    let lamports = ctx.accounts.task.lamports();
    ctx.accounts.task.sub_lamports(lamports)?;
    ctx.accounts.creator.add_lamports(lamports)?;
    ctx.accounts.task.assign(&anchor_lang::system_program::ID);
    ctx.accounts.task.resize(0)?;
    Ok(())
}
