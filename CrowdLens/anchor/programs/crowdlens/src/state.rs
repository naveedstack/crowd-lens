use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct CreatorStats {
    pub creator: Pubkey,
    pub task_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct TaskEscrow {
    pub creator: Pubkey,
    pub nonce: u64,
    pub amount: u64,
    pub required: u32,
    pub remaining_lamports: u64,
    pub vote_commitment: [u8; 32],
    pub chunks_paid: u32,
    pub settled: bool,
    pub winner_option_id: u32,
}
