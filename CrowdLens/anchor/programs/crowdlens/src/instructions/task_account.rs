use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::{constants::*, error::CrowdLensError, state::TaskEscrow};

const TASK_DISCRIMINATOR_LEN: usize = 8;
const LEGACY_TASK_LEN: usize = 105;

pub fn verify_task_pda(task: &AccountInfo) -> Result<(Pubkey, u64)> {
    require_keys_eq!(*task.owner, crate::ID, CrowdLensError::InvalidTask);
    let data = task.try_borrow_data()?;
    require!(data.len() >= LEGACY_TASK_LEN, CrowdLensError::InvalidTask);
    let creator = Pubkey::try_from(&data[8..40]).map_err(|_| CrowdLensError::InvalidTask)?;
    let nonce = u64::from_le_bytes(
        data[40..48]
            .try_into()
            .map_err(|_| CrowdLensError::InvalidTask)?,
    );
    drop(data);
    let (expected, _) =
        Pubkey::find_program_address(&[TASK_SEED, creator.as_ref(), &nonce.to_le_bytes()], &crate::ID);
    require_keys_eq!(expected, task.key(), CrowdLensError::InvalidTask);
    Ok((creator, nonce))
}

pub fn resize_task_if_needed<'info>(
    task: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
) -> Result<()> {
    let new_len = TASK_DISCRIMINATOR_LEN + TaskEscrow::INIT_SPACE;
    if task.data_len() >= new_len {
        return Ok(());
    }
    let rent = Rent::get()?;
    let needed = rent.minimum_balance(new_len);
    let have = task.lamports();
    if have < needed {
        transfer(
            CpiContext::new(
                anchor_lang::system_program::ID,
                Transfer {
                    from: authority.clone(),
                    to: task.clone(),
                },
            ),
            needed - have,
        )?;
    }
    task.resize(new_len)?;
    Ok(())
}

pub fn load_task(task: &AccountInfo) -> Result<TaskEscrow> {
    let data = task.try_borrow_data()?;
    TaskEscrow::try_deserialize(&mut &data[..])
}

pub fn store_task(task: &AccountInfo, state: &TaskEscrow) -> Result<()> {
    let mut data = task.try_borrow_mut_data()?;
    let mut cursor: &mut [u8] = &mut data;
    state.try_serialize(&mut cursor)?;
    Ok(())
}
