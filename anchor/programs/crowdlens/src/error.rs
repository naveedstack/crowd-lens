use anchor_lang::prelude::*;

#[error_code]
pub enum CrowdLensError {
    #[msg("Only the program authority can run this instruction")]
    Unauthorized,
    #[msg("Task nonce does not match the creator's next nonce")]
    BadNonce,
    #[msg("Escrow amount must be greater than zero")]
    BadAmount,
    #[msg("Vote commitment has already been set")]
    VotesAlreadyCommitted,
    #[msg("Votes must be committed before settling")]
    VotesNotCommitted,
    #[msg("Cannot commit an empty vote hash")]
    EmptyCommitment,
    #[msg("Settle chunk must include 1 to 4 workers")]
    InvalidChunkSize,
    #[msg("Amount list does not match remaining worker accounts")]
    AmountAccountMismatch,
    #[msg("Payout amount must be greater than zero")]
    ZeroPayout,
    #[msg("Payout total exceeds remaining escrow")]
    Overpay,
    #[msg("Math overflow")]
    Overflow,
    #[msg("Worker account must be writable")]
    WorkerNotWritable,
    #[msg("Invalid worker account")]
    InvalidWorker,
    #[msg("Duplicate worker in the same chunk")]
    DuplicateWorker,
    #[msg("Task has already been closed")]
    AlreadySettled,
    #[msg("Cannot close while escrow lamports remain")]
    EscrowNotEmpty,
    #[msg("Required vote count must be greater than zero")]
    BadRequired,
    #[msg("Task account is invalid")]
    InvalidTask,
}
