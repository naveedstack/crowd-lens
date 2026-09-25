use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const CREATOR_SEED: &[u8] = b"creator";

#[constant]
pub const TASK_SEED: &[u8] = b"task";

#[constant]
pub const LAMPORTS_PER_VOTE: u64 = 1_000_000;

pub const MAX_SETTLE_CHUNK: usize = 4;
