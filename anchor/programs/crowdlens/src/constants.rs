use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const CREATOR_SEED: &[u8] = b"creator";

#[constant]
pub const TASK_SEED: &[u8] = b"task";

pub const MAX_SETTLE_CHUNK: usize = 4;
